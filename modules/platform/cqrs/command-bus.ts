export type Command = { name:string; version:number; tenantId:string; actorId:string; commandId:string; correlationId:string; payload:Record<string,unknown> };
export type CommandHandler<T extends Command=Command> = (command:T)=>Promise<unknown>|unknown;
export class CommandBus {
  private handlers = new Map<string, CommandHandler>();
  register(name:string, version:number, handler:CommandHandler){ this.handlers.set(`${name}@${version}`,handler); return this; }
  async dispatch(command:Command){
    if(!command.commandId || !command.tenantId || !command.actorId || !command.correlationId) throw new Error('COMMAND_CONTEXT_REQUIRED');
    const handler=this.handlers.get(`${command.name}@${command.version}`); if(!handler) throw new Error('COMMAND_HANDLER_NOT_FOUND');
    return handler(command);
  }
}
