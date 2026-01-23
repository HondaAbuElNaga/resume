"use client";

import Image from "next/image";

/**
 * Animated Resume Templates component.
 * 
 * Displays floating/scrolling resume template images for visual appeal.
 * 
 * To add your own CV images:
 * 1. Create CV images (recommended: 300x400px PNG)
 * 2. Save them to: /public/templates/
 * 3. Update the templateImages array below
 */

// Template images configuration
// Add your CV template images here
const templateImages = [
  { id: 1, src: "/templates/cv-1.png", alt: "Professional CV Template" },
  { id: 2, src: "/templates/cv-2.png", alt: "Modern CV Template" },
  { id: 3, src: "/templates/cv-3.png", alt: "Creative CV Template" },
  { id: 4, src: "/templates/cv-4.png", alt: "Minimal CV Template" },
  // { id: 5, src: "/templates/cv-5.png", alt: "Executive CV Template" },
  // { id: 6, src: "/templates/cv-6.png", alt: "Designer CV Template" },
];

// Fallback placeholder when images are not available
const usePlaceholders = false; // Set to false when you add real images

export default function AnimatedTemplates() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-300 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-200 rounded-full blur-3xl" />
      </div>

      {/* Tilted container - fills the entire space */}
      <div 
        className="absolute flex gap-5 origin-center justify-center"
        style={{ 
          transform: 'rotate(-12deg) scale(1.2)',
          top: '-20%',
          left: '-10%',
          right: '-10%',
          bottom: '-20%',
          width: '120%',
          height: '140%',
        }}
      >
        {/* Column 1 - Scrolling up */}
        <div className="w-[260px] flex-shrink-0 overflow-hidden">
          <div className="animate-scroll-up space-y-5">
            {usePlaceholders ? (
              <>
                <PlaceholderCV style="classic" name="Ahmed Hassan" title="Software Engineer" />
                <PlaceholderCV style="modern" name="Sara Ahmed" title="UI/UX Designer" />
                <PlaceholderCV style="minimal" name="Omar Khalid" title="Data Scientist" />
                <PlaceholderCV style="creative" name="Layla Noor" title="Product Manager" />
                <PlaceholderCV style="classic" name="Karim Ali" title="Full Stack Dev" />
                <PlaceholderCV style="modern" name="Nadia Salem" title="Marketing Lead" />
                {/* Duplicates for seamless loop */}
                <PlaceholderCV style="classic" name="Ahmed Hassan" title="Software Engineer" />
                <PlaceholderCV style="modern" name="Sara Ahmed" title="UI/UX Designer" />
                <PlaceholderCV style="minimal" name="Omar Khalid" title="Data Scientist" />
              </>
            ) : (
              <>
                {[...templateImages, ...templateImages, ...templateImages].map((img, idx) => (
                  <CVImage key={`col1-${idx}`} src={img.src} alt={img.alt} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Column 2 - Scrolling down */}
        <div className="w-[260px] flex-shrink-0 overflow-hidden">
          <div className="animate-scroll-down space-y-5">
            {usePlaceholders ? (
              <>
                <PlaceholderCV style="modern" name="Youssef Faris" title="DevOps Engineer" />
                <PlaceholderCV style="creative" name="Hana Mahmoud" title="Business Analyst" />
                <PlaceholderCV style="classic" name="Zain Abbas" title="Creative Director" />
                <PlaceholderCV style="minimal" name="Reem Saad" title="HR Manager" />
                <PlaceholderCV style="modern" name="Tariq Nasser" title="Cloud Architect" />
                <PlaceholderCV style="creative" name="Dina Fouad" title="Content Writer" />
                {/* Duplicates for seamless loop */}
                <PlaceholderCV style="modern" name="Youssef Faris" title="DevOps Engineer" />
                <PlaceholderCV style="creative" name="Hana Mahmoud" title="Business Analyst" />
                <PlaceholderCV style="classic" name="Zain Abbas" title="Creative Director" />
              </>
            ) : (
              <>
                {[...templateImages.slice(2), ...templateImages, ...templateImages].map((img, idx) => (
                  <CVImage key={`col2-${idx}`} src={img.src} alt={img.alt} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Column 3 - Scrolling up (slower) */}
        <div className="w-[260px] flex-shrink-0 overflow-hidden hidden lg:block">
          <div className="animate-scroll-up space-y-5" style={{ animationDuration: '35s' }}>
            {usePlaceholders ? (
              <>
                <PlaceholderCV style="creative" name="Amira Lotfy" title="Brand Designer" />
                <PlaceholderCV style="classic" name="Fadi Haddad" title="Finance Director" />
                <PlaceholderCV style="modern" name="Salma Rizk" title="Mobile Developer" />
                <PlaceholderCV style="minimal" name="Walid Shaker" title="CTO" />
                <PlaceholderCV style="creative" name="Aya Mansour" title="Art Director" />
                <PlaceholderCV style="classic" name="Hassan Youssef" title="Project Lead" />
                {/* Duplicates for seamless loop */}
                <PlaceholderCV style="creative" name="Amira Lotfy" title="Brand Designer" />
                <PlaceholderCV style="classic" name="Fadi Haddad" title="Finance Director" />
                <PlaceholderCV style="modern" name="Salma Rizk" title="Mobile Developer" />
              </>
            ) : (
              <>
                {[...templateImages.slice(1), ...templateImages, ...templateImages].map((img, idx) => (
                  <CVImage key={`col3-${idx}`} src={img.src} alt={img.alt} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Column 4 - Scrolling down (extra wide screens) */}
        <div className="w-[260px] flex-shrink-0 overflow-hidden hidden xl:block">
          <div className="animate-scroll-down space-y-5" style={{ animationDuration: '38s' }}>
            {usePlaceholders ? (
              <>
                <PlaceholderCV style="minimal" name="Rania Khaled" title="Data Engineer" />
                <PlaceholderCV style="classic" name="Mahmoud Sayed" title="Backend Dev" />
                <PlaceholderCV style="creative" name="Noura Fathy" title="UX Researcher" />
                <PlaceholderCV style="modern" name="Ali Hassan" title="DevOps Lead" />
                <PlaceholderCV style="minimal" name="Heba Youssef" title="Product Owner" />
                <PlaceholderCV style="classic" name="Khaled Nabil" title="Tech Lead" />
                {/* Duplicates for seamless loop */}
                <PlaceholderCV style="minimal" name="Rania Khaled" title="Data Engineer" />
                <PlaceholderCV style="classic" name="Mahmoud Sayed" title="Backend Dev" />
                <PlaceholderCV style="creative" name="Noura Fathy" title="UX Researcher" />
              </>
            ) : (
              <>
                {[...templateImages.slice(3), ...templateImages, ...templateImages].map((img, idx) => (
                  <CVImage key={`col4-${idx}`} src={img.src} alt={img.alt} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Blur overlays for smooth edges */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-20 via-blue-50/90 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-20 via-blue-50/90 to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-blue-20 via-blue-50/90 to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-blue-20 via-blue-50/70 to-transparent pointer-events-none z-10" />
    </div>
  );
}

/**
 * CV Image component - displays actual CV template images
 */
function CVImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
      <Image
        src={src}
        alt={alt}
        width={600}
        height={780}
        quality={100}
        unoptimized
        className="w-full h-auto object-cover"
        style={{ aspectRatio: '8.5/11' }}
      />
    </div>
  );
}

/**
 * Placeholder CV - Beautiful coded placeholders until real images are added
 */
function PlaceholderCV({ style, name, title }: { style: 'classic' | 'modern' | 'minimal' | 'creative'; name: string; title: string }) {
  if (style === 'classic') {
    return (
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100" style={{ aspectRatio: '8.5/11', minHeight: '340px' }}>
        <div className="bg-slate-800 text-white p-4">
          <h2 className="text-sm font-bold tracking-wide">{name}</h2>
          <p className="text-[10px] text-slate-300 mt-0.5">{title}</p>
          <div className="flex gap-3 mt-2 text-[8px] text-slate-400">
            <span>📧 email@mail.com</span>
            <span>📱 +1 234 567</span>
          </div>
        </div>
        <div className="flex p-3 gap-3">
          <div className="w-1/3 space-y-3">
            <div>
              <h3 className="text-[9px] font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1">SKILLS</h3>
              <div className="space-y-1">
                {['JavaScript', 'React', 'Node.js'].map((skill) => (
                  <div key={skill} className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600 rounded-full" style={{ width: `${70 + Math.random() * 30}%` }} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-[9px] font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1">EDUCATION</h3>
              <p className="text-[8px] text-slate-600 font-medium">BSc Computer Science</p>
              <p className="text-[7px] text-slate-400">MIT • 2018-2022</p>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-[9px] font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1">EXPERIENCE</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-[8px] font-semibold text-slate-700">Senior Developer</p>
                  <p className="text-[7px] text-slate-500">Google • 2022-Present</p>
                  <div className="mt-1 space-y-0.5">
                    <div className="h-1.5 bg-slate-100 rounded w-full" />
                    <div className="h-1.5 bg-slate-100 rounded w-11/12" />
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-semibold text-slate-700">Developer</p>
                  <p className="text-[7px] text-slate-500">Amazon • 2020-2022</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (style === 'modern') {
    return (
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100" style={{ aspectRatio: '8.5/11', minHeight: '340px' }}>
        <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400" />
        <div className="p-4 pb-3">
          <h2 className="text-base font-bold text-slate-900">{name}</h2>
          <p className="text-[10px] text-blue-600 font-medium">{title}</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[7px] rounded-full">Remote</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[7px] rounded-full">Full-time</span>
          </div>
        </div>
        <div className="px-4 space-y-3">
          <div>
            <h3 className="text-[9px] font-bold text-blue-600 mb-1">ABOUT ME</h3>
            <div className="space-y-1">
              <div className="h-1.5 bg-slate-100 rounded w-full" />
              <div className="h-1.5 bg-slate-100 rounded w-11/12" />
              <div className="h-1.5 bg-slate-100 rounded w-3/4" />
            </div>
          </div>
          <div>
            <h3 className="text-[9px] font-bold text-blue-600 mb-1">EXPERIENCE</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="w-1 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-[8px] font-semibold text-slate-700">Lead Designer at Apple</p>
                  <p className="text-[7px] text-slate-400">2021 - Present</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-1 bg-blue-300 rounded-full" />
                <div className="flex-1">
                  <p className="text-[8px] font-semibold text-slate-700">Designer at Meta</p>
                  <p className="text-[7px] text-slate-400">2019 - 2021</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-[9px] font-bold text-blue-600 mb-1">SKILLS</h3>
            <div className="flex flex-wrap gap-1">
              {['Figma', 'Sketch', 'Adobe XD'].map((skill) => (
                <span key={skill} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[7px] rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (style === 'minimal') {
    return (
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 p-4" style={{ aspectRatio: '8.5/11', minHeight: '340px' }}>
        <div className="text-center border-b border-slate-200 pb-3 mb-3">
          <h2 className="text-sm font-light tracking-widest text-slate-900 uppercase">{name}</h2>
          <p className="text-[10px] text-slate-500 mt-1">{title}</p>
          <div className="flex justify-center gap-3 mt-2 text-[7px] text-slate-400">
            <span>email@mail.com</span>
            <span>•</span>
            <span>linkedin.com/in/user</span>
          </div>
        </div>
        <div className="mb-3">
          <h3 className="text-[8px] font-medium text-slate-400 tracking-widest mb-1">PROFILE</h3>
          <div className="space-y-1">
            <div className="h-1.5 bg-slate-50 rounded w-full" />
            <div className="h-1.5 bg-slate-50 rounded w-5/6" />
          </div>
        </div>
        <div className="mb-3">
          <h3 className="text-[8px] font-medium text-slate-400 tracking-widest mb-1">EXPERIENCE</h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-baseline">
                <p className="text-[8px] font-medium text-slate-700">Data Scientist</p>
                <p className="text-[6px] text-slate-400">2022-NOW</p>
              </div>
              <p className="text-[7px] text-slate-500">Microsoft</p>
            </div>
            <div>
              <div className="flex justify-between items-baseline">
                <p className="text-[8px] font-medium text-slate-700">ML Engineer</p>
                <p className="text-[6px] text-slate-400">2020-2022</p>
              </div>
              <p className="text-[7px] text-slate-500">Tesla</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-[8px] font-medium text-slate-400 tracking-widest mb-1">SKILLS</h3>
          <p className="text-[7px] text-slate-600">Python • TensorFlow • SQL • AWS</p>
        </div>
      </div>
    );
  }

  // Creative style
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 flex" style={{ aspectRatio: '8.5/11', minHeight: '340px' }}>
      <div className="w-1/3 bg-gradient-to-b from-violet-600 to-purple-700 p-3 text-white">
        <div className="w-12 h-12 rounded-full bg-white/20 mx-auto mb-2 flex items-center justify-center text-lg font-bold">
          {name.charAt(0)}
        </div>
        <h2 className="text-[10px] font-bold text-center">{name}</h2>
        <p className="text-[8px] text-violet-200 text-center">{title}</p>
        <div className="mt-3 space-y-1 text-[7px] text-violet-200">
          <p>📧 email@mail.com</p>
          <p>📱 +1 234 567 890</p>
          <p>📍 New York, USA</p>
        </div>
        <div className="mt-3">
          <h3 className="text-[8px] font-bold mb-1">SKILLS</h3>
          <div className="space-y-1">
            {['Branding', 'Typography'].map((skill) => (
              <div key={skill} className="flex items-center gap-1">
                <span className="text-[7px]">{skill}</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full">
                  <div className="h-full bg-white/60 rounded-full" style={{ width: `${60 + Math.random() * 40}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 p-3">
        <div className="mb-3">
          <h3 className="text-[9px] font-bold text-violet-600 mb-1">ABOUT</h3>
          <div className="space-y-1">
            <div className="h-1.5 bg-slate-100 rounded w-full" />
            <div className="h-1.5 bg-slate-100 rounded w-4/5" />
          </div>
        </div>
        <div className="mb-3">
          <h3 className="text-[9px] font-bold text-violet-600 mb-1">EXPERIENCE</h3>
          <div className="space-y-2">
            <div>
              <p className="text-[8px] font-semibold text-slate-700">Art Director</p>
              <p className="text-[7px] text-slate-400">Spotify • 2021-Present</p>
            </div>
            <div>
              <p className="text-[8px] font-semibold text-slate-700">Designer</p>
              <p className="text-[7px] text-slate-400">Airbnb • 2019-2021</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-[9px] font-bold text-violet-600 mb-1">EDUCATION</h3>
          <p className="text-[8px] font-medium text-slate-700">MFA Graphic Design</p>
          <p className="text-[7px] text-slate-400">RISD • 2019</p>
        </div>
      </div>
    </div>
  );
}
