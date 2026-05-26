export enum Role {
  ARTIST = 'ARTIST',
  CLIENT = 'CLIENT',
  ADMIN  = 'ADMIN',
}
export enum AuthProvider {
  LOCAL  = 'LOCAL',
  GOOGLE = 'GOOGLE',
}
export enum ServiceStatus {
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT    = 'DRAFT',
}
export enum BookingStatus {
  PENDING     = 'PENDING',
  CONFIRMED   = 'CONFIRMED',
  PAID        = 'PAID',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED   = 'COMPLETED',
  CANCELLED   = 'CANCELLED',
  REJECTED    = 'REJECTED',
  EXPIRED     = 'EXPIRED',
}
export enum ServiceCategory {
  MARIAGE            = 'MARIAGE',
  SOIREE             = 'SOIREE',
  SHOOTING           = 'SHOOTING',
  EDITORIAL          = 'EDITORIAL',
  SFX                = 'SFX',
  BEAUTE_QUOTIDIENNE = 'BEAUTE_QUOTIDIENNE',
  SCENE_SPECTACLE    = 'SCENE_SPECTACLE',
  AUTRE              = 'AUTRE',
}
