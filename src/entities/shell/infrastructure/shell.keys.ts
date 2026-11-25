export const shellKeys = {
  all: ['shell'] as const,
  track: () => [...shellKeys.all, 'track'] as const,
  resume: () => [...shellKeys.all, 'resume'] as const,
  periods: (weeks?: number) => [...shellKeys.all, 'periods', weeks] as const,
  messages: () => [...shellKeys.all, 'messages'] as const,
  office: (roomId: number) => [...shellKeys.all, 'office', roomId] as const,
  notices: (role: 'student' | 'teacher', roomId: number) =>
    [...shellKeys.all, 'notices', role, roomId] as const,
  overview: (studentId: number, roomId?: number) =>
    [...shellKeys.all, 'overview', studentId, roomId] as const,
  sentMessages: (studentId: number, roomId?: number) =>
    [...shellKeys.all, 'sent', studentId, roomId] as const,
  policy: () => [...shellKeys.all, 'policy'] as const,
};
