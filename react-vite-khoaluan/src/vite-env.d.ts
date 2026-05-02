/// <reference types="vite/client" />

// Thêm khai báo cho file .vue
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Thêm khai báo cho các import SCSS inline
declare module "*?inline&lang=scss" {
  const content: string;
  export default content;
}
