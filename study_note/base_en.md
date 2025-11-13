# Basic Bash Commands

## 1. echo Command

### 1.1 -n Parameter

The -n parameter removes the trailing newline character, preventing output from breaking to a new line. For example:

```bash
echo -n "Hello, World!"
# Output: Hello, World$
```

```bash
echo -a;echo b
# Output:
# a
# b

echo -n a;echo b
# Output: ab
```

In the above example, the -n parameter allows the output of two echo commands to display on the same line.

### 1.2 -e Parameter

The -e parameter interprets special characters within quotes (such as newline character \n, tab character \t, etc.). For example:

```bash
echo "Hello\nWorld"
# Output: Hello\nWorld

echo -e "Hello\nWorld"
# Output:
# Hello
# World
```

In the above code, after using the -e parameter, \n is interpreted as a newline character, causing "World" to display on a new line.

## 2. Command Format

In the command line environment, various operations are mainly performed using shell commands. Shell commands basically follow the format below:

```bash
command [arg1 ... [argN]]
```

Here, command is a specific command or an executable file, and arg1...argN are parameters passed to the specific command, which are optional.

### Parameter Forms

```bash
# Short parameter
ls -r

# Long parameter
ls --reverse
```

Some parameters are configuration options for the command. These configuration options usually start with a hyphen (-) or double hyphen (--), followed by the parameter name or abbreviation. There are long and short forms. Short parameters are usually convenient for quick input, while long parameters are more readable. Long parameters are typically used in bash scripts to improve code readability, while short parameters are more suitable for quick input in the command line.

## 3. Line Continuation

Bash commands are generally executed in one line when the user presses the Enter key. For longer commands, you can use a backslash (\) for line continuation. For example:

```bash
echo foo bar

# Equivalent to
echo foo \
bar
```

In the above code, the backslash (\) is used to split a long command into multiple lines to improve readability. When executed, the shell concatenates these lines into one line for execution.

## 4. Whitespace

Bash uses spaces or Tab keys to distinguish different parameters. If there are multiple spaces, bash will automatically ignore the extra spaces.

```bash
echo    Hello     World
# Output: Hello World
```

## 5. Semicolon

The semicolon (;) is a command terminator. Multiple commands can be placed on one line, and the next command executes after the previous one completes.

```bash
clear; ls
```

In the above code, the ls command executes immediately after the clear command completes.

## 6. Command Combinators && and ||

Besides the semicolon (;), bash has two other command combinators && and ||, which are used to decide whether to execute the next command based on the execution result of the previous command.

- && is the logical AND operator. If the first command executes successfully (returns 0), the second command is executed
- || is the logical OR operator. If the first command fails (returns non-zero), the second command is executed

```bash
# Logical AND operator &&
command1 && command2

# Logical OR operator ||
command1 || command2
```

Examples:

```bash
mkdir test_dir && cd test_dir

cd non_exist_dir || echo "Directory does not exist"
```

The above example creates a directory test_dir and enters it if creation is successful. The second command attempts to enter a non-existent directory, and outputs a message if it fails.

## 7. type Command

The type command is used to determine whether a command is a built-in command or an external program.

```bash
type echo
# Output: echo is a shell builtin

type ls
# Output: ls is hashed (/bin/ls)
```

In the above code, the type command determines the source of the echo and ls commands respectively. echo is a shell built-in command, while ls is an external program located at /bin/ls. The type command itself is also a shell built-in command.

To view all definitions of a command, you can use the -a parameter:

```bash
type -a echo
# Output:
# echo is a shell builtin
# echo is /usr/bin/echo
# echo is /bin/echo
```

The -t parameter of the type command returns the type of the command: keyword, builtin, file, alias, etc. For example:

```bash
type -t cd
# Output: builtin

type -t ls
# Output: file
```

## 8. Keyboard Shortcuts

In the bash command line, there are many keyboard shortcuts that can improve operational efficiency. Here are some commonly used shortcuts:

- Ctrl + A: Move cursor to the beginning of the line
- Ctrl + E: Move cursor to the end of the line
- Ctrl + U: Delete all content before the cursor
- Ctrl + K: Delete all content after the cursor
- Ctrl + W: Delete the word before the cursor
- Ctrl + Y: Paste the most recently deleted content
- Ctrl + L: Clear the screen, equivalent to the clear command
- Ctrl + R: Reverse search through command history
- Tab: Auto-complete commands or file names
- Up/Down Arrow Keys: Browse command history
