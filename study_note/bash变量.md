# Bash变量

## 1. 环境变量和自定义变量

bash变量分为环境变量和自定义变量

环境变量通常bash环境自带的变量，进入时shell就定义好了，可以直接使用，也可以从父shell继承过来，比如PATH、HOME等。
用env或printenv命令可以查看当前环境变量

```bash
$ env
```
常见环境变量：
- PATH：系统命令搜索路径
- HOME：用户主目录
- USER：当前用户名
- SHELL：当前使用的shell类型

ps.很多环境变量很少发生变化，而且是只读的，可视为常量。变量名一般大写字母表示。所以一般定义常量是也是用大写字母命名。bash变量区分大小写。

自定义变量时用户自己定义的变量，可以用来存储数据，方便脚本编写和执行。

set命令可查看所有变量，包括环境变量和自定义变量
```bash
$ set
```


## 2.创建变量
创建变量时，变量名和等号之间不能有空格，变量名只能包含字母、数字和下划线，且不能以数字开头。赋值时不需要使用$符号。

```bash
$ MY_VAR="Hello, World!"
$ ANOTHER_VAR=42
```
变量可以重复赋值，后面的值会覆盖前面的值。

```bash
$ MY_VAR="First Value"
$ echo $MY_VAR
First Value
$ MY_VAR="Second Value"
$ echo $MY_VAR
Second Value
```
同一行可定义多个变量，用分号隔开
## 3.读取变量
读取变量时，需要在变量名前加上$符号。

```bash
$ echo $MY_VAR
Hello, World!
$ echo $ANOTHER_VAR
42
```

## 4.删除变量

使用unset命令可以删除变量

```bash
$ unset MY_VAR
$ echo $MY_VAR
# 没有输出，变量已被删除
```
也可以改成空值

## 5.输出变量，export命令

用户创建的变量仅仅只能在当前shell中使用，不能被继承到子shell中。如果想让变量在子shell中也能使用，需要使用export命令，这样的变量对子shell就是环境变量。
子shell修改的变量不会影响父shell的变量值
```bash
$ MY_VAR="Hello"
$ export MY_VAR
$ bash  # 进入子shell
$ echo $MY_VAR
Hello
$ MY_VAR="Changed in child shell"
$ exit  # 退出子shell
$ echo $MY_VAR
Hello
```
## 6. 一些特殊变量
bash中有一些特殊变量，用于存储特定的信息：
- $0：当前脚本的名称
- $1, $2, ...：传递给脚本的第1、第2...个参数
- $#：传递给脚本的参数个数
- $@：传递给脚本的所有参数，作为一个整体
- $?：上一个命令的退出状态，0表示成功，非0表示失败
- $$：当前shell的进程ID
- $!：最后一个后台运行的进程ID
```bash
$ echo "Script name: $0"
$ echo "First argument: $1"
$ echo "Number of arguments: $#"
$ some_command
$ echo "Last command exit status: $?"
```
这些特殊变量在编写脚本时非常有用，可以帮助我们获取脚本的运行状态和传递的参数信息。

## 7. 变量的默认值

在bash中，可以为变量设置默认值，以防止变量未定义或为空时导致错误。可以使用以下语法：

```bash
${VAR:-default_value}
```
如果变量VAR未定义或为空，则返回default_value，否则返回VAR的值。
```bash
${VAR:=default_value}
```
如果变量VAR未定义或为空，则将其赋值为default_value。
```bash
${VAR:+alternative_value}
```
如果变量VAR已定义且非空，则返回alternative_value，否则返回空字符串。
```bash
${VAR:?error_message}
```
如果变量VAR未定义或为空，则输出error_message并终止脚本执行。主要防止变量未定义。


## 8.declare命令
declare命令用于声明变量的属性，可以用来创建数组、只读变量等。
语法形式:
```bash
declare [options] variable_name
```
常用选项：
- -r：将变量声明为只读，不能修改
- -a：将变量声明为数组

