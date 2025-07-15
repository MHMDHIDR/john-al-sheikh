"use client";

import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconBrandX,
} from "@tabler/icons-react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  // These are just anchor tags with target _blank for now
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return (
    <div className="flex flex-wrap gap-2 justify-center my-6">
      <a
        href={`https://www.facebook.com/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#1877F2] hover:bg-[#0e5fc7] p-2 transition-colors"
        title="مشاركة في فيسبوك"
      >
        <IconBrandFacebook className="size-5 stroke-white" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#000] hover:bg-[#222] p-2 transition-colors"
        title="مشاركة في تويتر"
      >
        <IconBrandX className="size-5 stroke-white" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#0A66C2] hover:bg-[#004182] p-2 transition-colors"
        title="مشاركة في لينكدإن"
      >
        <IconBrandLinkedin className="size-5 stroke-white" />
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle} - ${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#25D366] hover:bg-[#1da748] p-2 transition-colors"
        title="مشاركة في واتساب"
      >
        <IconBrandWhatsapp className="size-5 stroke-white" />
      </a>
      <a
        href="#"
        onClick={e => {
          e.preventDefault();
          void navigator.clipboard.writeText(url);
          alert("تم نسخ رابط المقال! يمكنك الآن مشاركته على انستغرام أو أي مكان آخر.");
        }}
        className="rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 p-2 transition-colors"
        title="مشاركة في انستغرام (انسخ الرابط)"
      >
        <IconBrandInstagram className="size-5 stroke-white" />
      </a>
    </div>
  );
}
