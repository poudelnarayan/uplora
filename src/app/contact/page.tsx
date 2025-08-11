"use client";

import AppShell from "@/components/layout/AppShell";
import { useState, useEffect } from "react";
import { TextField, SelectField } from "@/components/ui/TextField";
import { Mail, User, MessageSquare, Send, Lightbulb, Bug, HelpCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ContactPage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [includeEmail, setIncludeEmail] = useState(true);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session?.user?.name, session?.user?.email]);

  const maxChars = 1200;
  const used = message.length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      const composed = `${subject ? `Subject: ${subject}\n` : ""}${name ? `From: ${name}${email ? ` <${email}>` : ""}\n` : ""}\n${message}`;
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: composed, category, includeEmail, path: "/contact" })
      });
      setSent(true);
      setMessage("");
      setSubject("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="heading-2">Contact us</h1>
          <p className="text-sm text-muted-foreground">Have a question, request, or found a bug? Send us a note and we’ll get back to you.</p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">Message sent</h3>
                <p className="text-sm text-muted-foreground">Thanks! We received your message and will get back to you at the email provided if follow‑up is needed.</p>
                <button className="btn btn-ghost btn-sm mt-3" onClick={() => setSent(false)}>Send another</button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={submit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Your name"
                  icon={<User className="w-4 h-4" />}
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName((e.target as HTMLInputElement).value)}
                />
                <TextField
                  label="Email (optional)"
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Subject"
                  icon={<MessageSquare className="w-4 h-4" />}
                  placeholder="How can we help?"
                  value={subject}
                  onChange={(e) => setSubject((e.target as HTMLInputElement).value)}
                />
                <SelectField
                  label="Category"
                  icon={<Lightbulb className="w-4 h-4" />}
                  value={category}
                  onChange={(e) => setCategory((e.target as HTMLSelectElement).value)}
                >
                  <option>General</option>
                  <option>Accounts</option>
                  <option>Sales</option>
                </SelectField>
              </div>

              <div>
                <TextField
                  label="Message"
                  icon={<HelpCircle className="w-4 h-4" />}
                  placeholder="Describe your request or issue with as much detail as possible..."
                  value={message}
                  onChange={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
                  multiline
                />
                <div className="mt-1 text-[11px] text-muted-foreground text-right">{used}/{maxChars}</div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={includeEmail} onChange={(e) => setIncludeEmail(e.target.checked)} />
                  Allow follow‑up via email
                </label>
                <button type="submit" className="btn btn-primary" disabled={loading || used === 0 || used > maxChars}>
                  {loading ? (<><div className="spinner mr-2" />Sending...</>) : (<><Send className="w-4 h-4 mr-2" />Send</>)}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
