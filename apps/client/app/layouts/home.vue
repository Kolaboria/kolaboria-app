<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { FileText, Folder, House, UserRound } from "@lucide/vue";
import type { Profile } from "../types/profile";
import { getProfileEditPageMeta } from "../data/profile-edit-navigation";
import type { HomeNavbarConfig } from "../types/home-navbar";

const { logout: signOut, user } = useAuth();
const { getProfile } = useProfile();
const router = useRouter();
const route = useRoute();

const isUserDropdownOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);
const userProfile = ref<Profile | null>(null);

const profilePath = "/profile/me";
const mobileBottomNavItems = [
  { to: "/home", label: "Beranda", icon: House },
  { to: "/projects/my-applications", label: "Lamaranku", icon: FileText },
  { to: "/projects/my-projects", label: "Project", icon: Folder },
  { to: profilePath, label: "Profil", icon: UserRound },
] as const;
const normalizedRoutePath = computed(
  () => route.path.replace(/\/+$/, "") || "/",
);
const isApplicantSimulationRoute = computed(() =>
  /^\/projects\/[^/]+\/applicants\/?$/.test(route.path),
);
const profileEditPageMeta = computed(() => getProfileEditPageMeta(route.path));
const isProfileEditRoute = computed(() => profileEditPageMeta.value !== null);
const isMobileBottomNavRoute = computed(() =>
  mobileBottomNavItems.some((item) => item.to === normalizedRoutePath.value),
);
const mobileNavbar = computed<HomeNavbarConfig | null>(
  () => (route.meta.homeNavbar as HomeNavbarConfig | undefined) ?? null,
);
const isProfileEditFormRoute = computed(
  () => isProfileEditRoute.value && !profileEditPageMeta.value?.isMenu,
);
let desktopMediaQuery: MediaQueryList | null = null;

const displayName = computed(
  () => userProfile.value?.full_name || user.value?.name || "User",
);

const loadNavbarProfile = async () => {
  const isProfileOverview = /^\/profile\/[^/]+\/?$/.test(route.path);
  const shouldLoadForCurrentRoute =
    !mobileNavbar.value || desktopMediaQuery?.matches === true;

  if (
    user.value &&
    !isProfileOverview &&
    !isApplicantSimulationRoute.value &&
    shouldLoadForCurrentRoute
  ) {
    userProfile.value = await getProfile();
  }
};

const handleViewportChange = (event: MediaQueryListEvent) => {
  if (event.matches) void loadNavbarProfile();
};

onMounted(() => {
  desktopMediaQuery = window.matchMedia("(min-width: 1024px)");
  void loadNavbarProfile();
  desktopMediaQuery.addEventListener("change", handleViewportChange);
});

onBeforeUnmount(() => {
  desktopMediaQuery?.removeEventListener("change", handleViewportChange);
});

useClickOutside(userMenuRef, () => {
  isUserDropdownOpen.value = false;
});

const handleLogout = async () => {
  await signOut();
  router.push("/login");
};

const handleMobileNavbarBack = () => {
  router.back();
};
</script>

<template>
  <div
    class="min-h-screen bg-neutral-50 font-sans text-neutral-900"
    :class="isProfileEditFormRoute ? 'flex flex-col' : ''"
  >
    <nav
      class="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur"
    >
      <div class="mx-auto lg:max-w-5/6 px-4">
        <div
          class="h-16 items-center justify-between gap-6"
          :class="
            mobileNavbar?.variant === 'back-path' ? 'hidden lg:flex' : 'flex'
          "
        >
          <div class="flex items-center gap-8">
            <NuxtLink
              to="/home"
              class="flex items-center gap-2"
              aria-label="Kolaboria home"
            >
              <img src="~/assets/img/logo.svg" alt="Kolaboria" class="h-8" />
            </NuxtLink>

            <div class="hidden items-center gap-1 md:flex">
              <NuxtLink
                to="/home"
                class="rounded-lg px-3 py-2 font-label-1 text-secondary transition-colors hover:bg-neutral-100 hover:text-primary-700"
                active-class="bg-primary-50 text-primary-700"
              >
                Beranda
              </NuxtLink>
              <NuxtLink
                to="/projects/my-applications"
                class="rounded-lg px-3 py-2 font-label-1 text-secondary transition-colors hover:bg-neutral-100 hover:text-primary-700"
                active-class="bg-primary-50 text-primary-700"
              >
                Lamaranku
              </NuxtLink>
              <NuxtLink
                to="/projects/my-projects"
                class="rounded-lg px-3 py-2 font-label-1 text-secondary transition-colors hover:bg-neutral-100 hover:text-primary-700"
                active-class="bg-primary-50 text-primary-700"
              >
                Project Saya
              </NuxtLink>
              <NuxtLink
                :to="profilePath"
                class="rounded-lg px-3 py-2 font-label-1 text-secondary transition-colors hover:bg-neutral-100 hover:text-primary-700"
                active-class="bg-primary-50 text-primary-700"
              >
                Profil
              </NuxtLink>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <NotificationCenter />

            <div
              ref="userMenuRef"
              class="relative hidden border-l border-neutral-200 pl-4 md:block"
            >
              <button
                type="button"
                class="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-neutral-50 focus:outline-none"
                @click="isUserDropdownOpen = !isUserDropdownOpen"
              >
                <div class="hidden text-right sm:block">
                  <p class="font-body-1 leading-none text-secondary-900">
                    {{ displayName }}
                  </p>
                  <p class="mt-1 font-label-2 text-secondary">
                    {{ user?.email }}
                  </p>
                </div>
                <AtomicAvatar
                  :src="userProfile?.avatar"
                  :name="displayName"
                  size="sm"
                  class="h-9! w-9!"
                />
              </button>

              <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="scale-95 opacity-0"
                enter-to-class="scale-100 opacity-100"
                leave-active-class="transition ease-in duration-100"
                leave-from-class="scale-100 opacity-100"
                leave-to-class="scale-95 opacity-0"
              >
                <div
                  v-if="isUserDropdownOpen"
                  class="absolute right-0 z-50 mt-3 w-52 origin-top-right rounded-xl border border-neutral-200 bg-white py-2 shadow-lg shadow-secondary-900/10"
                >
                  <NuxtLink
                    :to="profilePath"
                    class="block px-4 py-2 font-body-2 transition-colors hover:bg-neutral-50 hover:text-secondary-900"
                  >
                    Profil Saya
                  </NuxtLink>
                  <a
                    href="#"
                    class="block px-4 py-2 font-body-2 transition-colors hover:bg-neutral-50 hover:text-secondary-900"
                  >
                    Pusat Bantuan
                  </a>
                  <AtomicButton
                    variant="ghost-danger"
                    @click="handleLogout"
                    class="w-full! justify-start! py-2! px-4!"
                  >
                    Keluar
                  </AtomicButton>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <div
          v-if="mobileNavbar?.variant === 'back-path'"
          class="flex h-16 items-center lg:hidden"
        >
          <AtomicIconButton
            variant="ghost"
            size="lg"
            class="-ml-4 mr-4"
            :aria-label="`Kembali dari ${mobileNavbar.title}`"
            title="Kembali"
            @click="handleMobileNavbarBack"
          >
            <Icon
              name="lucide:arrow-left"
              class="h-24 w-24 text-neutral-900"
              aria-hidden="true"
            />
          </AtomicIconButton>
          <h1 class="min-w-0 truncate font-title-3 text-secondary-900">
            {{ mobileNavbar.title }}
          </h1>
        </div>
      </div>
    </nav>

    <main
      class="mx-auto w-full pt-4"
      :class="[
        mobileNavbar?.mainWidth === 'wide' ? 'lg:max-w-7xl' : 'lg:max-w-4/6',
        mobileNavbar?.mainHorizontalPadding === 'none' ? 'px-0' : 'px-4',
        isMobileBottomNavRoute ? 'pb-24 md:pb-4' : '',
        isProfileEditFormRoute ? 'flex flex-1 flex-col pb-0 lg:pb-4' : '',
      ]"
    >
      <slot />
    </main>

    <nav
      v-if="isMobileBottomNavRoute"
      aria-label="Navigasi utama"
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-neutral-200 bg-white/95 px-4 py-2 backdrop-blur-md md:hidden"
      style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom))"
    >
      <NuxtLink
        v-for="item in mobileBottomNavItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center gap-1 font-label-3 transition-colors"
        :class="
          normalizedRoutePath === item.to
            ? 'text-primary-700 font-bold'
            : 'text-neutral-500'
        "
        :aria-current="normalizedRoutePath === item.to ? 'page' : undefined"
      >
        <component
          :is="item.icon"
          :size="20"
          :stroke-width="2"
          class="h-5 w-5"
          aria-hidden="true"
        />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>
