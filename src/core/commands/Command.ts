/**
 * Command pattern implementation for undo/redo system
 * 撤销/重做系统的命令模式实现
 */

/**
 * Base command interface
 * 基础命令接口
 */
export interface Command {
  /** Command unique identifier */
  id: string;
  /** Command name for display */
  name: string;
  /** Command description */
  description: string;
  /** Execute the command */
  execute(): void | Promise<void>;
  /** Undo the command */
  undo(): void | Promise<void>;
  /** Whether this command can be merged with another */
  canMerge(other: Command): boolean;
  /** Merge with another command */
  merge?(other: Command): Command;
  /** Command creation timestamp */
  timestamp: number;
}

/**
 * Abstract base command class
 * 抽象基础命令类
 */
export abstract class BaseCommand implements Command {
  public readonly id: string;
  public readonly timestamp: number;

  constructor(
    public readonly name: string,
    public readonly description: string = ''
  ) {
    this.id = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = Date.now();
  }

  abstract execute(): void | Promise<void>;
  abstract undo(): void | Promise<void>;

  canMerge(_other: Command): boolean {
    return false; // Default: commands cannot be merged
  }

  merge?(_other: Command): Command {
    throw new Error('Merge not supported for this command');
  }
}

/**
 * Macro command that contains multiple sub-commands
 * 包含多个子命令的宏命令
 */
export class MacroCommand extends BaseCommand {
  private commands: Command[] = [];

  constructor(name: string, commands: Command[] = []) {
    super(name, `Macro command containing ${commands.length} operations`);
    this.commands = [...commands];
  }

  addCommand(command: Command): void {
    this.commands.push(command);
  }

  async execute(): Promise<void> {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  async undo(): Promise<void> {
    // Execute undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }

  canMerge(other: Command): boolean {
    return other instanceof MacroCommand && 
           this.commands.length + other.commands.length <= 100; // Limit macro size
  }

  merge(other: Command): Command {
    if (other instanceof MacroCommand) {
      return new MacroCommand(
        `${this.name} + ${other.name}`,
        [...this.commands, ...other.commands]
      );
    }
    throw new Error('Cannot merge with non-macro command');
  }

  getCommands(): readonly Command[] {
    return this.commands;
  }
}

/**
 * Command execution result
 * 命令执行结果
 */
export interface CommandResult {
  success: boolean;
  error?: string;
  data?: any;
}