// This file acts as a simple module-level guard to ensure the code that imports it 
// is only executed on the server to prevent secrets from leaking into client bundles.

if (typeof window !== 'undefined') {
  throw new Error(
    "This module cannot be imported from a client component. It should only be used on the server."
  );
}

export const isServer = true;
