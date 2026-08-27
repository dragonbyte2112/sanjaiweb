import { crudFactory } from "./crudFactory.js";

// Public visitors only ever see approved testimonials.
export default crudFactory("testimonials", {
  publicFilter: (item) => item.approved === true,
});
