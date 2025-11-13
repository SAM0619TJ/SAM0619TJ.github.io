# Bash 基础命令

## 1. echo 命令

### 1.1 -n 参数

-n 参数可以取消末尾的回车符号，使输出内容不换行。例如：

```bash
$ echo -n "Hello, World!"
Hello, World$
```

```bash
$ echo -a;echo b
a
b

$ echo -n a;echo b
ab
```

上述例子中，-n 参数可以让两个 echo 命令的输出在同一行显示。

### 1.2 -e 参数

-e 参数会解释引号里的特殊字符（比如换行字符 \n、制表符 \t 等）。例如：

```bash
$ echo "Hello\nWorld"
Hello\nWorld

$ echo -e "Hello\nWorld"
Hello
World
```

上述代码中，使用 -e 参数后，\n 被解释为换行符，从而使 "World" 显示在新的一行。

## 2. 命令格式

命令行环境中，主要通过使用 shell 命令进行各种操作。shell 命令基本都是下列的格式：

```bash
command [arg1 ... [argN]]
```

其中 command 是具体的命令或一个可执行文件，arg1...argN 是传递给具体命令的参数，它们是可选的。

### 参数形式

```bash
# 短参数
ls -r

# 长参数
ls --reverse
```

有些参数是命令的配置项，这些配置项通常用连字符（-）或双连字符（--）开头，后面跟着参数名称或缩写。有长短形式，短参数通常便于快速输入，长参数则更具可读性。长参数通常在 bash 脚本中使用，以提高代码的可读性，短参数则更适合在命令行中快速输入。

## 3. 换行

bash 命令一般都是一行，用户按下回车键就开始执行。有些命令比较长，可以使用反斜杠（\）进行换行。例如：

```bash
echo foo bar

# 等同于
echo foo \
bar
```

上述代码中，反斜杠（\）用于将长命令分成多行，以提高可读性。执行时，shell 会将这些行连接成一行来执行。

## 4. 空格

bash 使用空格或 Tab 键区分不同的参数。若有多个空格，bash 会自动忽略多余的空格。

```bash
echo    Hello     World
# 输出: Hello World
```

## 5. 分号

分号（;）是命令的结束符，一行可以放置多个命令，上个执行完后就执行下一个。

```bash
clear; ls
```

上述代码中，clear 命令执行完后，紧接着执行 ls 命令。

## 6. 命令组合符 && 和 ||

除了分号（;），bash 还有两个命令组合符 && 和 ||，它们用于根据前一个命令的执行结果来决定是否执行下一个命令。

- && 是逻辑与运算符，如果第一个命令执行成功（返回 0 值），则执行第二个命令
- || 是逻辑或运算符，如果第一个命令执行失败（返回非 0 值），则执行第二个命令

```bash
# 逻辑与运算符 &&
command1 && command2

# 逻辑或运算符 ||
command1 || command2
```

示例：

```bash
mkdir test_dir && cd test_dir

cd non_exist_dir || echo "Directory does not exist"
```

上面例子的意思是创建一个目录 test_dir，如果创建成功则进入该目录。第二个命令尝试进入一个不存在的目录，如果失败则输出提示信息。

## 7. type 命令

type 命令用于判断命令是内置命令还是外部程序。

```bash
type echo
# 输出: echo is a shell builtin

type ls
# 输出: ls is hashed (/bin/ls)
```

上述代码中，type 命令分别判断了 echo 和 ls 命令的来源。echo 是 shell 内置命令，而 ls 是外部程序，位于 /bin/ls 路径下。type 本身也是一个 shell 内置命令。

若要查看一个命令的所有定义，可以使用 -a 参数：

```bash
type -a echo
# 输出:
# echo is a shell builtin
# echo is /usr/bin/echo
# echo is /bin/echo
```

type 命令的 -t 参数可以返回命令的类型：keyword（关键词）、builtin（内置命令）、file（文件）、alias（别名）等。例如：

```bash
type -t cd
# 输出: builtin

type -t ls
# 输出: file
```

## 8. 快捷键

在 bash 命令行中，有许多快捷键可以提高操作效率。以下是一些常用的快捷键：

- Ctrl + A: 移动光标到行首
- Ctrl + E: 移动光标到行尾
- Ctrl + U: 删除光标前的所有内容
- Ctrl + K: 删除光标后的所有内容
- Ctrl + W: 删除光标前的一个单词
- Ctrl + Y: 粘贴最近删除的内容
- Ctrl + L: 清屏，相当于 clear 命令
- Ctrl + R: 反向搜索历史命令
- Tab: 自动补全命令或文件名
- 上下方向键: 浏览命令历史
