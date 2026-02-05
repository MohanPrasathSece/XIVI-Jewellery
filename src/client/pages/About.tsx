import aboutBanner from "@/assets/about-banner.jpg";

const About = () => {
  return (
    <main className="min-h-screen pt-16 md:pt-20">
      {/* Banner Section */}
      <section className="relative h-96 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${aboutBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        <div className="relative z-10 h-full flex items-center justify-center">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-center animate-fade-in">
            Crafted with grace,
            <br />
            <span className="text-gradient-rose">worn with confidence</span>
          </h1>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-4 bg-gradient-champagne">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-8 animate-fade-in transition-transform duration-500 hover:-translate-y-1">
            <div>
              <h2 className="font-playfair text-3xl md:text-4xl font-semibold mb-6 text-center">
                Our Story
              </h2>
              <div className="w-24 h-1 bg-gradient-rose mx-auto rounded-full mb-8" />
            </div>

            <p className="text-lg text-foreground/90 leading-relaxed">
              XIVI was born from a passion for timeless beauty and exceptional silver craftsmanship.
              We believe that every woman deserves silver jewellery that not only adorns but empowers—pieces
              that become cherished companions through life's precious moments.
            </p>

            <p className="text-lg text-foreground/90 leading-relaxed">
              Our collections are meticulously designed in Pune, where tradition meets contemporary
              elegance. Each piece is handcrafted by skilled artisans who pour their expertise and
              dedication into creating silver jewellery that transcends trends and celebrates individuality.
            </p>

            <p className="text-lg text-foreground/90 leading-relaxed">
              We source only the finest materials—pure silver that catches the light with cool radiance,
              ethically-sourced gemstones that sparkle with natural beauty, and sustainable practices
              that honor both our craft and our planet.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-playfair text-3xl md:text-4xl font-semibold mb-4 text-center">
            What We Stand For
          </h2>
          <div className="w-24 h-1 bg-gradient-rose mx-auto rounded-full mb-16" />

          <div className="grid md:grid-cols-3 gap-10">
            <div className="group text-center animate-fade-in rounded-2xl border border-transparent bg-white/60 backdrop-blur-sm px-6 py-10 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-glow">
              <div className="w-16 h-16 bg-gradient-rose rounded-full mx-auto mb-6 flex items-center justify-center shadow-soft transition-transform duration-500 group-hover:scale-110">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-3">
                Timeless Design
              </h3>
              <p className="text-muted-foreground">
                Classic elegance that never goes out of style, designed to be treasured for generations.
              </p>
            </div>

            <div className="group text-center animate-fade-in rounded-2xl border border-transparent bg-white/60 backdrop-blur-sm px-6 py-10 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-glow" style={{ animationDelay: "100ms" }}>
              <div className="w-16 h-16 bg-gradient-rose rounded-full mx-auto mb-6 flex items-center justify-center shadow-soft transition-transform duration-500 group-hover:scale-110">
                <span className="text-2xl">🌿</span>
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-3">
                Sustainability
              </h3>
              <p className="text-muted-foreground">
                Ethically sourced materials and responsible practices that honor our environment.
              </p>
            </div>

            <div className="group text-center animate-fade-in rounded-2xl border border-transparent bg-white/60 backdrop-blur-sm px-6 py-10 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-glow" style={{ animationDelay: "200ms" }}>
              <div className="w-16 h-16 bg-gradient-rose rounded-full mx-auto mb-6 flex items-center justify-center shadow-soft transition-transform duration-500 group-hover:scale-110">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-3">
                Craftsmanship
              </h3>
              <p className="text-muted-foreground">
                Handcrafted by skilled artisans with meticulous attention to every detail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 px-4 bg-secondary/20">
        <div className="container mx-auto max-w-3xl text-center animate-fade-in">
          <blockquote className="font-playfair text-2xl md:text-3xl italic font-light text-primary mb-6 transition-transform duration-500 hover:scale-[1.02]">
            "Jewelry is not an accessory.
            <br />
            It's a reflection of the woman who wears it."
          </blockquote>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </div>
      </section>
    </main>
  );
};

export default About;
