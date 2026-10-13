<template>
  <section
    class="relative min-h-screen flex items-center bg-primary-500 overflow-hidden"
  >
    <div
      class="k-dot-texture absolute inset-0 pointer-events-none opacity-[.06]"
      aria-hidden="true"
    ></div>

    <div
      class="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div class="hidden lg:block k-aurora-1"></div>
      <div class="hidden lg:block k-aurora-2"></div>
      <div
        class="absolute -left-[10%] top-[20%] w-96 h-96 bg-primary-400/20 rounded-full blur-[80px] animate-float-strong"
      ></div>
      <div
        class="absolute left-[15%] bottom-[10%] w-80 h-80 bg-accent-400/15 rounded-full blur-[100px] animate-float-strong"
        style="animation-delay: -4s"
      ></div>
    </div>

    <svg
      class="k-particles absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        class="k-particle"
        cx="10%"
        cy="20%"
        r="2"
        fill="white"
        opacity="0.25"
      />
      <circle
        class="k-particle"
        cx="85%"
        cy="12%"
        r="1.5"
        fill="white"
        opacity="0.2"
        style="animation-delay: 1.2s"
      />
      <circle
        class="k-particle"
        cx="55%"
        cy="80%"
        r="2.5"
        fill="var(--color-accent-400)"
        opacity="0.35"
        style="animation-delay: 2.4s"
      />
      <circle
        class="k-particle"
        cx="25%"
        cy="70%"
        r="1.5"
        fill="white"
        opacity="0.2"
        style="animation-delay: 0.8s"
      />
      <circle
        class="k-particle"
        cx="70%"
        cy="50%"
        r="1.5"
        fill="var(--color-accent-400)"
        opacity="0.2"
        style="animation-delay: 3.5s"
      />
      <circle
        class="k-particle"
        cx="40%"
        cy="30%"
        r="1.5"
        fill="white"
        opacity="0.15"
        style="animation-delay: 1.8s"
      />
      <circle
        class="k-particle"
        cx="90%"
        cy="75%"
        r="2"
        fill="white"
        opacity="0.18"
        style="animation-delay: 4s"
      />

      <line
        class="k-particle-line"
        x1="10%"
        y1="20%"
        x2="25%"
        y2="70%"
        stroke="white"
        stroke-width="0.5"
        opacity="0.08"
      />
      <line
        class="k-particle-line"
        x1="55%"
        y1="80%"
        x2="70%"
        y2="50%"
        stroke="white"
        stroke-width="0.5"
        opacity="0.08"
      />
      <line
        class="k-particle-line"
        x1="85%"
        y1="12%"
        x2="70%"
        y2="50%"
        stroke="white"
        stroke-width="0.5"
        opacity="0.08"
      />
    </svg>

    <div class="k-container relative z-10 pt-28 pb-20 lg:pt-32 lg:pb-28 w-full">
      <div
        class="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-10 items-center"
      >
        <div>
          <h1
            :ref="(el) => revealItems(el, 1)"
            class="reveal k-headline text-white"
            style="--delay: 100ms"
          >
            Ubah Idemu<br />
            Jadi Proyek Nyata.
          </h1>

          <p
            :ref="(el) => revealItems(el, 2)"
            class="reveal mt-5 text-white/75 font-paragraph-2 max-w-[500px]"
            style="--delay: 200ms"
          >
            Kolaboria menghubungkan inisiator proyek dengan talenta digital
            terbaik. Bukan sekadar jaringan, ini adalah kolaborasi yang
            bergerak.
          </p>

          <div
            :ref="(el) => revealItems(el, 3)"
            class="reveal mt-10 flex flex-col sm:flex-row gap-3"
            style="--delay: 300ms"
          >
            <NuxtLink
              to="/register"
              class="group inline-flex items-center justify-center gap-2"
            >
              <AtomicButton variant="primary"> Mulai Kolaborasi </AtomicButton>
            </NuxtLink>
          </div>

          <div
            :ref="(el) => revealItems(el, 4)"
            class="reveal mt-8 flex gap-8 border-t border-white/15 pt-8"
            style="--delay: 400ms"
          >
            <div v-for="stat in heroStats" :key="stat.label">
              <p class="text-2xl font-black text-white tracking-tight">
                {{ stat.value }}<span class="text-accent-400">+</span>
              </p>
              <p class="text-white/70 font-body-3 mt-0.5">
                {{ stat.label }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="hidden lg:flex justify-center items-center relative h-[450px]"
        >
          <!-- Floating Notif Badges -->
          <div
            class="absolute top-[2%] right-[10%] animate-float z-20"
            style="animation-delay: 1.5s"
          >
            <div
              :ref="(el) => revealItems(el, 6)"
              class="reveal-scale flex items-center gap-2 bg-accent-400 backdrop-blur-md border border-neutral-100 py-1.5 px-4 rounded-full shadow-lg"
              style="--delay: 600ms"
            >
              <span class="text-secondary-800 font-label-3"
                >Proyek Diterbitkan</span
              >
            </div>
          </div>

          <div
            class="absolute bottom-[22%] -left-[5%] animate-float z-20"
            style="animation-delay: 0.5s"
          >
            <div
              :ref="(el) => revealItems(el, 7)"
              class="reveal-scale flex items-center gap-2 bg-secondary-500 backdrop-blur-md border border-neutral-100 py-1.5 px-4 rounded-full shadow-lg"
              style="--delay: 700ms"
            >
              <span class="text-white font-label-3">Slot FE Terisi</span>
            </div>
          </div>

          <div
            class="absolute bottom-[5%] right-[5%] animate-float z-20"
            style="animation-delay: 2.5s"
          >
            <div
              :ref="(el) => revealItems(el, 8)"
              class="reveal-scale flex items-center gap-2 bg-success-500 backdrop-blur-md border border-neutral-100 py-1.5 px-4 rounded-full shadow-lg"
              style="--delay: 800ms"
            >
              <span class="text-white font-label-3"
                >Kolaborator Bergabung</span
              >
            </div>
          </div>

          <!-- Main Mock Card -->
          <div
            :ref="(el) => revealItems(el, 5)"
            class="reveal-right"
            style="--delay: 500ms"
          >
            <div
              class="relative z-10 w-[380px] bg-white rounded-2xl p-6 shadow-2xl shadow-primary-900/40 ring-1 ring-neutral-200 -translate-y-2 k-tilt-card"
            >
              <!-- Header -->
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h3
                    class="text-secondary-900 font-bold text-lg leading-tight mb-1"
                  >
                    Kolaboria Mobile App
                  </h3>
                  <p class="text-secondary font-body-3">Oleh Ahmad Fazri</p>
                </div>
                <div
                  class="flex items-center gap-1.5 bg-success-50 border border-success-100 px-2 py-1 rounded-md"
                >
                  <div class="relative flex h-2 w-2">
                    <span
                      class="relative inline-flex rounded-full h-2 w-2 bg-success-500"
                    ></span>
                  </div>
                  <span
                    class="text-success-700 font-label-3 uppercase tracking-wider"
                    >Aktif</span
                  >
                </div>
              </div>

              <!-- Roles -->
              <div class="flex gap-2 mb-6">
                <div
                  class="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200"
                >
                  <span class="text-secondary-700 font-body-3 font-medium">UI/UX</span>
                  <span class="text-neutral-400 font-body-3">1/1</span>
                </div>
                <div
                  class="flex items-center gap-1.5 bg-primary-50 px-2.5 py-1.5 rounded-lg border border-primary-200"
                >
                  <span class="text-primary-600 font-body-3 font-medium"
                    >Frontend</span
                  >
                  <span class="text-primary-400 font-body-3">0/2</span>
                </div>
                <div
                  class="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200"
                >
                  <span class="text-secondary-700 font-body-3 font-medium">Backend</span>
                  <span class="text-neutral-400 font-body-3">1/1</span>
                </div>
              </div>

              <!-- Progress -->
              <div class="mb-6">
                <div class="flex justify-between font-body-3 mb-2">
                  <span class="text-secondary">Progress</span>
                  <span class="text-secondary-900 font-medium">65%</span>
                </div>
                <div
                  class="h-2 w-full bg-neutral-100 rounded-full overflow-hidden"
                >
                  <div class="h-full bg-primary-400 rounded-full w-[65%]"></div>
                </div>
              </div>

              <div class="h-px w-full bg-neutral-200 mb-6"></div>

              <!-- Activity Feed -->
              <div class="space-y-4">
                <p
                  class="text-neutral-400 font-label-3 uppercase tracking-wider mb-2"
                >
                  Aktivitas Terkini
                </p>

                <div class="flex items-center gap-3">
                  <img
                    src="https://ui-avatars.com/api/?name=Ahmad&background=4AB8E0&color=fff&size=24"
                    class="w-6 h-6 rounded-full"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-secondary-700 font-body-3 truncate">
                      <span class="font-semibold text-secondary-900">Ahmad</span>
                      melakukan commit: setup auth
                    </p>
                  </div>
                  <span class="text-neutral-400 font-body-3">2m</span>
                </div>

                <div class="flex items-center gap-3">
                  <img
                    src="https://ui-avatars.com/api/?name=Sinta&background=FFB020&color=fff&size=24"
                    class="w-6 h-6 rounded-full"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-secondary-700 font-body-3 truncate">
                      <span class="font-semibold text-secondary-900">Sinta</span>
                      mengunggah desain Figma
                    </p>
                  </div>
                  <span class="text-neutral-400 font-body-3">15m</span>
                </div>

                <div class="flex items-center gap-3">
                  <div
                    class="w-6 h-6 rounded-full bg-secondary-500 flex items-center justify-center font-label-3 text-white"
                  >
                    D
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-secondary-700 font-body-3 truncate">
                      <span class="font-semibold text-secondary-900">Deri</span>
                      bergabung sebagai Backend
                    </p>
                  </div>
                  <span class="text-neutral-400 font-body-3">1h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="absolute bottom-[-1px] left-0 right-0 overflow-hidden leading-none z-10 w-full h-[12vh] min-h-[80px]"
    >
      <!-- Layer 1 (Slow, Back, Opacity 30%) -->
      <svg
        class="k-wave k-wave-1 absolute bottom-0 w-[200%] h-full opacity-30 text-white fill-current"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,60L48,56C96,52,192,44,288,52C384,60,480,84,576,88C672,92,768,76,864,68C960,60,1056,60,1152,64C1248,68,1344,76,1392,80L1440,84L1440,120L0,120Z"
        ></path>
        <path
          d="M1440,60L1488,56C1536,52,1632,44,1728,52C1824,60,1920,84,2016,88C2112,92,2208,76,2304,68C2400,60,2496,60,2592,64C2688,68,2784,76,2832,80L2880,84L2880,120L1440,120Z"
        ></path>
      </svg>

      <!-- Layer 2 (Mid, Opacity 60%) -->
      <svg
        class="k-wave k-wave-2 absolute bottom-0 w-[200%] h-full opacity-60 text-white fill-current"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,80L48,76C96,72,192,64,288,56C384,48,480,40,576,44C672,48,768,64,864,72C960,80,1056,80,1152,72C1248,64,1344,48,1392,40L1440,32L1440,120L0,120Z"
        ></path>
        <path
          d="M1440,80L1488,76C1536,72,1632,64,1728,56C1824,48,1920,40,2016,44C2112,48,2208,64,2304,72C2400,80,2496,80,2592,72C2688,64,2784,48,2832,40L2880,32L2880,120L1440,120Z"
        ></path>
      </svg>

      <!-- Layer 3 (Front, White Solid 100%) -->
      <svg
        class="k-wave k-wave-3 absolute bottom-0 w-[200%] h-full text-white fill-current"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,96L48,88C96,80,192,64,288,66.7C384,69,480,91,576,96C672,101,768,85,864,74.7C960,64,1056,59,1152,61.3C1248,64,1344,75,1392,80L1440,85.3L1440,120L0,120Z"
        ></path>
        <path
          d="M1440,96L1488,88C1536,80,1632,64,1728,66.7C1824,69,1920,91,2016,96C2112,101,2208,85,2304,74.7C2400,64,2496,59,2592,61.3C2688,64,2784,75,2832,80L2880,85.3L2880,120L1440,120Z"
        ></path>
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useScrollReveal } from '~/composables/useScrollReveal'

const { revealItems } = useScrollReveal()

const heroStats = [
  { value: '2k', label: 'Talenta Terdaftar' },
  { value: '150', label: 'Proyek Aktif' },
  { value: '500', label: 'Kolaborasi Terjalin' }
]
</script>
