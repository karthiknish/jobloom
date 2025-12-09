// Ambient module declaration for stripe
// This re-exports types from the stripe package installed in root node_modules
// The types are properly included in stripe v18.x but module resolution in monorepo
// requires this declaration file to properly resolve the types.

declare module 'stripe' {
  import Stripe from '../../../node_modules/stripe';
  export = Stripe;
  export default Stripe;
}
