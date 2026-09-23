#!/usr/bin/env ruby
# frozen_string_literal: true
#
# 红莲魔尊 · GitHub Pages 一键部署
#
# 这台机器上没有 git / gh，所以本脚本直接用 GitHub REST API 完成：
#   1. 创建（或复用）仓库
#   2. 逐个上传项目文件（含 assets/ 目录）
#   3. 开启 GitHub Pages（main 分支根目录）
#   4. 轮询构建状态，最后打印可访问的网址
#
# 用法：
#   ruby tools/deploy_github_pages.rb --token-file ~/.llchw_token
#   GITHUB_TOKEN=xxx ruby tools/deploy_github_pages.rb --repo my-site
#
# 仅使用 Ruby 标准库，无需安装任何依赖。

require "net/http"
require "uri"
require "json"
require "base64"

ROOT = File.expand_path("..", __dir__)
API_HOST = "api.github.com"

USAGE = <<~TEXT
  用法: ruby tools/deploy_github_pages.rb [选项]

    --repo NAME         仓库名，默认 honglian-mozun
    --token-file PATH   token 文件路径，默认 ~/.llchw_token
    --branch NAME       Pages 分支，默认 main
    --description TEXT  仓库描述
    --private           创建私有仓库（免费账号的 Pages 需要公开仓库）
    --dry-run           只列出将要上传的文件，不调用 API
    -h, --help          显示帮助

  也可以直接用环境变量 GITHUB_TOKEN 提供 token。
TEXT

options = {
  repo: "honglian-mozun",
  token_file: File.expand_path("~/.llchw_token"),
  branch: "main",
  description: "《蛊真人》同人企划：红莲魔尊 Steam 风格静态商店页面（纯 HTML/CSS/SVG）",
  private: false,
  dry: false
}

args = ARGV.dup
until args.empty?
  arg = args.shift
  case arg
  when "--repo"        then options[:repo] = args.shift
  when "--token-file"  then options[:token_file] = File.expand_path(args.shift)
  when "--branch"      then options[:branch] = args.shift
  when "--description" then options[:description] = args.shift
  when "--private"     then options[:private] = true
  when "--dry-run"     then options[:dry] = true
  when "-h", "--help"  then puts USAGE; exit 0
  else abort "未知参数: #{arg}\n\n#{USAGE}"
  end
end

# ---------------------------------------------------------------- 收集文件
SKIP_DIRS = [".git", ".github"].freeze

def collect_files(dir, base = dir, acc = [])
  Dir.children(dir).sort.each do |name|
    path = File.join(dir, name)
    rel = path.sub("#{base}/", "")
    if File.directory?(path)
      next if SKIP_DIRS.include?(name)
      collect_files(path, base, acc)
    else
      next if name.start_with?(".") && name != ".nojekyll"
      acc << rel
    end
  end
  acc
end

files = collect_files(ROOT)
abort "没有找到任何文件，ROOT=#{ROOT}" if files.empty?

puts "项目目录：#{ROOT}"
puts "将上传 #{files.size} 个文件："
files.each { |f| puts "  · #{f}" }

if options[:dry]
  puts "\n--dry-run：未调用任何 API。"
  exit 0
end

# ---------------------------------------------------------------- token
token = ENV["GITHUB_TOKEN"].to_s.strip
token = File.read(options[:token_file]).strip if token.empty? && File.file?(options[:token_file])

if token.empty?
  abort <<~TEXT
    找不到 GitHub token。请任选一种方式提供：
      1. 把 token 写入文件（推荐）：#{options[:token_file]}
      2. 运行时用环境变量：GITHUB_TOKEN=xxx ruby tools/deploy_github_pages.rb

    创建 token：https://github.com/settings/tokens/new
      · Note 随便填（例如 llchw-deploy）
      · 勾选 repo（classic token）即可创建公开仓库、上传文件并开启 Pages
  TEXT
end

# ---------------------------------------------------------------- API 客户端
class GitHub
  attr_reader :login

  def initialize(token)
    @token = token
    @http = Net::HTTP.new(API_HOST, 443)
    @http.use_ssl = true
    @http.open_timeout = 15
    @http.read_timeout = 60
  end

  def call(method, path, body = nil)
    request = case method
              when :get  then Net::HTTP::Get.new(path)
              when :post then Net::HTTP::Post.new(path)
              when :put  then Net::HTTP::Put.new(path)
              else raise ArgumentError, method.to_s
              end
    request["Authorization"] = "Bearer #{@token}"
    request["Accept"] = "application/vnd.github+json"
    request["User-Agent"] = "llchw-pages-deploy"
    request["X-GitHub-Api-Version"] = "2022-11-28"
    request["Content-Type"] = "application/json"
    request.body = JSON.generate(body) if body

    response = @http.request(request)
    payload =
      begin
        JSON.parse(response.body.to_s)
      rescue JSON::ParserError
        response.body.to_s
      end
    [response.code.to_i, payload]
  end

  def verify!
    code, payload = call(:get, "/user")
    abort "token 无效或已过期（HTTP #{code}）：#{payload.is_a?(Hash) ? payload["message"] : payload}" unless code == 200
    @login = payload["login"]
  end
end

gh = GitHub.new(token)
gh.verify!
owner = gh.login
repo = options[:repo]
puts "\n已认证为：#{owner}"
puts "目标仓库：#{owner}/#{repo}（#{options[:private] ? "私有" : "公开"}）"

# ---------------------------------------------------------------- 创建仓库
code, payload = gh.call(:post, "/user/repos", {
  name: repo,
  description: options[:description],
  private: options[:private],
  has_issues: true,
  has_wiki: false,
  has_projects: false,
  auto_init: false
})

case code
when 201
  puts "✓ 仓库已创建：https://github.com/#{owner}/#{repo}"
when 422
  puts "· 仓库已存在，继续上传文件：https://github.com/#{owner}/#{repo}"
else
  abort "创建仓库失败（HTTP #{code}）：#{payload.is_a?(Hash) ? payload["message"] : payload}"
end

# ---------------------------------------------------------------- 上传文件
def remote_sha(gh, owner, repo, branch, path)
  code, payload = gh.call(:get, "/repos/#{owner}/#{repo}/contents/#{path}?ref=#{branch}")
  return nil unless code == 200 && payload.is_a?(Hash)
  payload["sha"]
end

uploaded = 0
files.each do |rel|
  absolute = File.join(ROOT, rel)
  content = Base64.strict_encode64(File.binread(absolute))
  body = {
    message: "上传 #{rel}",
    content: content,
    branch: options[:branch]
  }
  existing = remote_sha(gh, owner, repo, options[:branch], rel)
  if existing
    body[:message] = "更新 #{rel}"
    body[:sha] = existing
  end

  code, payload = gh.call(:put, "/repos/#{owner}/#{repo}/contents/#{rel}", body)
  if code == 200 || code == 201
    uploaded += 1
    puts "  ✓ #{rel}（#{existing ? "已更新" : "新增"}）"
  else
    abort "上传 #{rel} 失败（HTTP #{code}）：#{payload.is_a?(Hash) ? payload["message"] : payload}"
  end
end

puts "\n共上传 #{uploaded} 个文件。"

# ---------------------------------------------------------------- 开启 Pages
pages_body = { source: { branch: options[:branch], path: "/" } }
code, payload = gh.call(:post, "/repos/#{owner}/#{repo}/pages", pages_body)

if code == 201 || code == 200
  puts "✓ 已开启 GitHub Pages（#{options[:branch]} 分支根目录）"
elsif code == 409
  code, payload = gh.call(:put, "/repos/#{owner}/#{repo}/pages", pages_body)
  puts(code >= 200 && code < 300 ? "✓ 已更新 GitHub Pages 配置" : "· Pages 配置返回 HTTP #{code}（可能需要在仓库设置里手动开启）")
else
  message = payload.is_a?(Hash) ? payload["message"] : payload
  puts "· 开启 Pages 返回 HTTP #{code}：#{message}"
  puts "  可以手动开启：https://github.com/#{owner}/#{repo}/settings/pages"
end

site = "https://#{owner}.github.io/#{repo}/"
puts "\n站点地址（首次构建通常需要 30～90 秒）：\n  #{site}"
puts "仓库地址：https://github.com/#{owner}/#{repo}"

# ---------------------------------------------------------------- 等待构建
print "\n等待构建完成"
12.times do
  sleep 10
  code, payload = gh.call(:get, "/repos/#{owner}/#{repo}/pages")
  status = payload.is_a?(Hash) ? payload["status"] : nil
  print "."
  if status == "built"
    puts "\n✓ Pages 已构建完成：#{site}"
    exit 0
  end
end

puts "\n· 仍在构建中，稍后自行访问：#{site}"
