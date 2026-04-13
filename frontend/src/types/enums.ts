// ============================================================
// ThinkWeave 枚举常量
// ============================================================

export enum ThinkLetType {
  FreeBrainstorm = 'FreeBrainstorm',
  LeafHopper = 'LeafHopper',
  FastFocus = 'FastFocus',
  BucketWalk = 'BucketWalk',
  PopcornSort = 'PopcornSort',
  StrawPoll = 'StrawPoll',
}

export enum ThinkLetCategory {
  Generate = 'generate',
  Clarify = 'clarify',
  Organize = 'organize',
  Evaluate = 'evaluate',
}

export enum AgentProvider {
  DeepSeek = 'deepseek',
  WenXin = 'wenxin',
  QianWen = 'qianwen',
  OpenAI = 'openai',
}

export enum MemberRole {
  Host = 'host',
  Member = 'member',
}

export enum RoomStatus {
  Waiting = 'waiting',
  Active = 'active',
  Paused = 'paused',
  Ended = 'ended',
}

export enum MessageType {
  User = 'user',
  AI = 'ai',
  System = 'system',
}
