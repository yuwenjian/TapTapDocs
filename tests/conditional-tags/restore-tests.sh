#!/bin/bash

# 恢复测试文件到初始状态的脚本

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# 基础目录配置
BASE_DIR="$SCRIPT_DIR"
PROCESS_SCRIPT="$ROOT_DIR/scripts/clean-conditional.js"
REGIONS=("cn" "hk")

# 输出彩色信息
print_green() {
  echo -e "\033[0;32m$1\033[0m"
}

print_cyan() {
  echo -e "\033[0;36m$1\033[0m"
}

print_red() {
  echo -e "\033[0;31m$1\033[0m"
}

# 显示进度信息
print_cyan "正在恢复测试文件到初始状态..."

# 对每个区域恢复文件
for region in "${REGIONS[@]}"; do
  # 检查原始目录是否存在
  if [ ! -d "$BASE_DIR/originals/$region" ]; then
    print_red "错误: 找不到原始测试文件目录 $BASE_DIR/originals/$region"
    continue
  fi
  
  # 创建目标目录(如果不存在)
  mkdir -p "$BASE_DIR/$region"
  
  # 复制所有.mdx文件
  cp "$BASE_DIR/originals/$region"/*.mdx "$BASE_DIR/$region/"
  
  print_cyan "已恢复 $region 区域的测试文件"
done

print_green "所有测试文件已恢复到初始状态！"