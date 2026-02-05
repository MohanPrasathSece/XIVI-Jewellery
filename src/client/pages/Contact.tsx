import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Here you would typically send the form data to your backend
    toast({
      title: "Message sent!",
      description: "Thank you for reaching out. We'll get back to you soon.",
    });

    setFormData({ name: "", email: "", message: "" });
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      "Hi, I'd like to learn more about XIVI silver jewellery."
    );
    window.open(`https://wa.me/919742999547?text=${message}`, "_blank");
  };

  return (
    <main className="min-h-screen pt-14 md:pt-16">
      {/* Header */}
      <section className="py-8 md:py-12 px-4 bg-gradient-champagne">
        <div className="container mx-auto max-w-4xl text-center animate-fade-in">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6">
            Get in <span className="text-gradient-rose">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            We'd love to hear from you. Reach out for inquiries, orders, or just to say hello.
          </p>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="animate-fade-in">
              <h2 className="font-playfair text-3xl font-semibold mb-8">
                Send Us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border/40 bg-white/80 backdrop-blur-sm p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-glow">
                <div>
                  <Label htmlFor="name" className="text-foreground">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="mt-2 border-border focus:border-primary transition-colors"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="mt-2 border-border focus:border-primary transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-foreground">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    className="mt-2 min-h-[150px] border-border focus:border-primary transition-colors resize-none"
                    placeholder="Tell us about your inquiry..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-rose hover:shadow-glow transition-all duration-500"
                  size="lg"
                >
                  Send Message
                </Button>
              </form>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  size="lg"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat on WhatsApp
                </Button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="animate-fade-in space-y-6" style={{ animationDelay: "100ms" }}>
              <h2 className="font-playfair text-3xl font-semibold mb-8">
                Contact Information
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4 rounded-2xl border border-transparent bg-white/70 backdrop-blur-sm px-6 py-5 transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft">
                  <div className="w-12 h-12 bg-gradient-rose rounded-full flex items-center justify-center flex-shrink-0 shadow-soft transition-transform duration-500 hover:scale-110">
                    <Phone className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-xl font-medium mb-2">
                      Phone
                    </h3>
                    <a
                      href="tel:+919742999547"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      +91 97429 99547
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-transparent bg-white/70 backdrop-blur-sm px-6 py-5 transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft">
                  <div className="w-12 h-12 bg-gradient-rose rounded-full flex items-center justify-center flex-shrink-0 shadow-soft transition-transform duration-500 hover:scale-110">
                    <Mail className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-xl font-medium mb-2">
                      Email
                    </h3>
                    <a
                      href="mailto:hello@xivi.in"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      hello@xivi.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-transparent bg-white/70 backdrop-blur-sm px-6 py-5 transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft">
                  <div className="w-12 h-12 bg-gradient-rose rounded-full flex items-center justify-center flex-shrink-0 shadow-soft transition-transform duration-500 hover:scale-110">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-xl font-medium mb-2">
                      Location
                    </h3>
                    <p className="text-muted-foreground">
                      Bangalore
                      <br />
                      India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-transparent bg-white/70 backdrop-blur-sm px-6 py-5 transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft">
                  <div className="w-12 h-12 bg-gradient-rose rounded-full flex items-center justify-center flex-shrink-0 shadow-soft transition-transform duration-500 hover:scale-110">
                    <Clock className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-playfair text-xl font-medium mb-2">
                      Business Hours
                    </h3>
                    <p className="text-muted-foreground">
                      Monday – Saturday
                      <br />
                      9:00 AM – 7:00 PM IST
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-8 bg-gradient-champagne rounded-2xl shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-glow">
                <h3 className="font-playfair text-2xl font-semibold mb-4 text-center">
                  Visit Our Showroom
                </h3>
                <p className="text-muted-foreground text-center">
                  Experience our collection in person. Schedule an appointment for
                  a personalized consultation with our jewelry experts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
