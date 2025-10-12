type Email = `${string}@${string}.${string}`;
type UUID = `${string}-${string}-${string}-${string}-${string}`;

type Name = string & { __brand: "Name" };
export function toName(n: string): Name {
  if (n.length == 0) throw new Error("Name cannot be empty");
  return n as Name;
}

type Quantity = number & { __brand: "Quantity" };
export function toQuantity(n: number): Quantity {
  if (n < 0) throw new Error("Must be ≥ 0");
  return n as Quantity;
}

enum Role {
  admin,
  standard,
}

enum LocationType {
  fridge,
  freezer,
  pantry,
}

export type User = {
  id: UUID;
  email: Email;
  name: Name;
  role: Role;
  created: Date;
  updated: Date;
};

export type Location = {
  id: UUID;
  name: Name;
  type: LocationType;
};

export type Item = {
  id: UUID;
  name: Name;
  location: Location;
  quanitiy: Quantity;
  expiration: Date;
  created: Date;
  updated: Date;
};
