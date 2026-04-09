export const FEATURE_KEYS = [
  'tracking',
  'fleet',
  'poi',
  'backoffice'
]

export const PERMISSION_KEYS = [
  'tracking.read',
  'fleet.read',
  'fleet.create',
  'fleet.update',
  'fleet.delete',
  'poi.read',
  'poi.create',
  'poi.update',
  'poi.delete',
  'companies.read',
  'companies.create',
  'companies.update',
  'users.read',
  'users.create',
  'users.update',
  'users.delete'
]

const ROLE_PERMISSION_TEMPLATE: Record<string, string[]> = {
  staff: [...PERMISSION_KEYS],
  owner: [
    'tracking.read',
    'fleet.read',
    'fleet.create',
    'fleet.update',
    'fleet.delete',
    'poi.read',
    'poi.create',
    'poi.update',
    'poi.delete'
  ],
  admin: [
    'tracking.read',
    'fleet.read',
    'fleet.create',
    'fleet.update',
    'fleet.delete',
    'poi.read',
    'poi.create',
    'poi.update',
    'poi.delete'
  ],
  dispatcher: [
    'tracking.read',
    'fleet.read',
    'fleet.create',
    'fleet.update',
    'poi.read'
  ],
  viewer: [
    'tracking.read',
    'fleet.read',
    'poi.read'
  ]
}

export function permissionTemplateForRole(role: string): string[] {
  return [...(ROLE_PERMISSION_TEMPLATE[role] || ROLE_PERMISSION_TEMPLATE.viewer)]
}
