import { crudFactory } from "./crudFactory.js";

// Public visitors only ever see approved testimonials.
export default crudFactory("testimonials", {
  publicMatch: { approved: true },
});
