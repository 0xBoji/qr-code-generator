'use client';

import { FormField, FormMessage, Form, FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from 'zod';
import QRCode from "qrcode";
import { useRouter } from 'next/navigation';
import crypto from 'crypto';

const formSchema = z.object({
  urls: z.string().refine((value) => {
    const urls = value.split('\n');
    return urls.every((url) => z.string().url().safeParse(url).success);
  }, {
    message: "Each line must be a valid URL"
  })
});

const size = 200; // Set a size for the QR code

export default function Home() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urls: ''
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const urls = values.urls.split('\n');
    const qrCodes = await Promise.all(urls.map(async (url) => {
      return await QRCode.toDataURL(url, { width: size });
    }));

    const hash = crypto.randomBytes(16).toString('hex');
    localStorage.setItem(hash, JSON.stringify(qrCodes));
    router.push(`/qr/${hash}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Form {...form}>
        <form
          className="w-1/2 flex flex-col gap-3"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField name="urls" control={form.control} render={({ field }) => (
            <FormItem className="flex-1">
              <textarea {...field} placeholder="Enter URLs, one per line" className="w-full h-32 p-2 border rounded" />
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="bg-green-500">Generate QR</Button>
        </form>
      </Form>
    </main>
  );
}
