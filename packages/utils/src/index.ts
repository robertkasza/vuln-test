import { capitalize } from 'lodash'

export function greet(name: string): string {
  return `Hello, ${capitalize(name)}!`
}
