import { User } from '@/models/User'

const KEY = 'lastLoginUser'

export async function fromCache(): Promise<User | null> {
  const value = localStorage.getItem(KEY)
  return value ? (JSON.parse(value) as User) : null
}

export async function cache(user: User): Promise<void> {
  localStorage.setItem(KEY, JSON.stringify(user))
}

export async function clear(): Promise<void> {
  localStorage.removeItem(KEY)
}
