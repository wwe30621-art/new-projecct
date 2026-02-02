import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const auth = useAuthStore();

// ✅ App 啟動：有 token 就補 me
const token = localStorage.getItem("token");
if (token) {
  auth.token = token;
  auth.fetchMe().catch(() => {
    auth.logout();
    router.replace("/login");
  });
}

app.mount("#app");
