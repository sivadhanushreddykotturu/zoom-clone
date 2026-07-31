export type Participant = {
  id: string
  name: string
  avatar: string
  isAdmin: boolean
  isSpeaking: boolean
  isMuted: boolean
  isSelf?: boolean
}

export const ROOM = {
  name: 'Late Night Frontend Jam',
  topic: 'Design systems, animations & the future of the web',
}

export const PARTICIPANTS: Participant[] = [
  {
    id: '1',
    name: 'Amara Okafor',
    avatar: '/avatars/avatar-1.png',
    isAdmin: true,
    isSpeaking: true,
    isMuted: false,
  },
  {
    id: '2',
    name: 'Raj Patel',
    avatar: '/avatars/avatar-2.png',
    isAdmin: true,
    isSpeaking: false,
    isMuted: false,
  },
  {
    id: '3',
    name: 'Mei Lin',
    avatar: '/avatars/avatar-3.png',
    isAdmin: false,
    isSpeaking: true,
    isMuted: false,
  },
  {
    id: '4',
    name: 'Daniel Brooks',
    avatar: '/avatars/avatar-4.png',
    isAdmin: false,
    isSpeaking: false,
    isMuted: true,
  },
  {
    id: 'self',
    name: 'You',
    avatar: '/avatars/avatar-5.png',
    isAdmin: true,
    isSpeaking: false,
    isMuted: true,
    isSelf: true,
  },
  {
    id: '6',
    name: 'Marcus Green',
    avatar: '/avatars/avatar-6.png',
    isAdmin: false,
    isSpeaking: false,
    isMuted: true,
  },
  {
    id: '7',
    name: 'Kenji Sato',
    avatar: '/avatars/avatar-7.png',
    isAdmin: false,
    isSpeaking: false,
    isMuted: false,
  },
  {
    id: '8',
    name: 'Ingrid Larsen',
    avatar: '/avatars/avatar-8.png',
    isAdmin: false,
    isSpeaking: false,
    isMuted: true,
  },
]
