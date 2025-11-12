#!/bin/bash

# 运行所有测试文件的脚本

# 获取脚本所在的目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# 基础目录配置
BASE_DIR="$SCRIPT_DIR"
PROCESS_SCRIPT="$ROOT_DIR/scripts/clean-conditional.js"
VERIFICATION_SCRIPT="$BASE_DIR/test-verification.js"
REGIONS=("cn" "hk")

# 输出彩色信息
print_green() {
  echo -e "\033[0;32m$1\033[0m"
}

print_cyan() {
  echo -e "\033[0;36m$1\033[0m"
}

print_yellow() {
  echo -e "\033[0;33m$1\033[0m"
}

print_red() {
  echo -e "\033[0;31m$1\033[0m"
}

# 确保脚本存在
if [ ! -f "$PROCESS_SCRIPT" ]; then
  echo "错误: 没有找到处理脚本 $PROCESS_SCRIPT"
  exit 1
fi

if [ ! -f "$VERIFICATION_SCRIPT" ]; then
  echo "错误: 没有找到验证脚本 $VERIFICATION_SCRIPT"
  exit 1
fi

# 显示进度信息
print_cyan "开始运行测试..."

# 先恢复测试文件的初始状态
"$BASE_DIR/restore-tests.sh"

# 运行所有区域测试
for region in "${REGIONS[@]}"; do
  region_upper=$(echo "$region" | tr '[:lower:]' '[:upper:]')
  print_cyan "测试 ${region_upper} 目录文件:"
  
  # 获取测试文件列表
  if [ ! -d "$BASE_DIR/originals/$region" ]; then
    print_red "错误: 找不到原始测试文件目录 $BASE_DIR/originals/$region"
    continue
  fi
  
  for file_name in "$BASE_DIR/originals/$region"/*.mdx; do
    base_name=$(basename "$file_name")
    file_path="$BASE_DIR/$region/$base_name"
    print_yellow "处理文件: $file_path"
    node "$PROCESS_SCRIPT" "$file_path" --root-path "$BASE_DIR"
    echo ""
  done
done

print_green "文件处理完成！"

# 检查是否需要更新预期结果
if [[ "$*" == *--update* ]]; then
  print_cyan "更新预期结果..."
  node "$VERIFICATION_SCRIPT" --update
else
  print_cyan "验证测试结果..."
  node "$VERIFICATION_SCRIPT"
fi
