import { motion } from "framer-motion";
import { AmbientEyes } from "@/components/AmbientEyes";
import { PortalCard } from "@/components/PortalCard";
import { DICE } from "@/data/dice";

export function HomePage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050609] text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,173,93,0.18),transparent_24rem),radial-gradient(circle_at_85%_10%,rgba(92,127,146,0.14),transparent_20rem),linear-gradient(180deg,#090b10_0%,#040507_55%,#020304_100%)]" />
      <AmbientEyes active normalizedPointer={{ x: 0.58, y: 0.22 }} reducedMotion={false} />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(110deg,rgba(255,255,255,0.02)_0,rgba(255,255,255,0.02)_1px,transparent_1px,transparent_36px)] opacity-25" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <p className="font-curse text-[0.74rem] uppercase tracking-[0.38em] text-amber-200/72">
            Cursed Dice Rooms
          </p>
          <h1 className="mt-4 text-5xl leading-tight text-stone-50 sm:text-6xl">
            Six bad little rooms
            <span className="mt-2 block text-amber-100/92">and one honest random number each</span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-stone-300/84">
            Choose a die portal and step into its private ritual. Every route is its own haunted toy:
            searchlights, eye courts, impact shafts, broken terminals, smug shards, and a d20 that thinks
            the stars work for it.
          </p>
        </motion.header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DICE.map((die, index) => (
            <motion.div
              key={die.id}
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
            >
              <PortalCard die={die} />
            </motion.div>
          ))}
        </section>

        <footer className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="room-panel rounded-[1.8rem] p-5">
            <p className="font-curse text-[0.68rem] uppercase tracking-[0.34em] text-stone-300/72">
              House rules
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-300/84">
              <li>Every room rolls a valid random result for its own die.</li>
              <li>The rooms are slightly rude, but still functional on mobile.</li>
              <li>Fake-outs are rare, short, and reserved for the neediest performers.</li>
            </ul>
          </div>

          <div className="room-panel rounded-[1.8rem] p-5">
            <p className="font-curse text-[0.68rem] uppercase tracking-[0.34em] text-stone-300/72">
              Current mood
            </p>
            <p className="mt-4 text-2xl text-stone-50">Like a haunted arcade cabinet trying very hard to be elegant.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}

