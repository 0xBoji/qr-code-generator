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
import { useState } from 'react';

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        form.setValue('urls', text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Form {...form}>
        <form
          className="w-1/2 flex flex-col gap-3"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <input 
            type="file" 
            accept=".txt" 
            onChange={handleFileUpload} 
            className="mb-4 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <FormField name="urls" control={form.control} render={({ field }) => (
            <FormItem className="flex-1">
              <textarea 
                {...field} 
                placeholder="Enter URLs, one per line" 
                className="w-full h-32 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
              <FormMessage />
            </FormItem>
          )} />
          <Button 
            type="submit" 
            className="bg-green-500 text-white py-2 px-4 rounded-md shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Generate QR
          </Button>
        </form>
      </Form>
    </main>
  );
}
