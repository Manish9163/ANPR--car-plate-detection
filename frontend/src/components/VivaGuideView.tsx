import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Cpu,
  Layers,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const VivaGuideView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const vivaQuestions = [
    {
      q: '1. What is the fundamental problem of ANPR in real-world conditions?',
      a: 'Real-world ANPR fails when treated as simple OCR because of unpredictable illumination, motion blur, non-perpendicular camera viewing angles (perspective distortion), dirty plates, and non-standard fonts. PlateVision solves this by splitting the problem into an adaptive multi-stage pipeline: edge-preserving bilateral denoising, CLAHE contrast equalization, YOLOv8 plate localization, 4-point perspective rectification, and context-aware character post-processing.',
    },
    {
      q: '2. Why did you use CLAHE instead of standard Histogram Equalization?',
      a: 'Global Histogram Equalization computes a single histogram across the entire image, which over-amplifies noise in already bright areas (such as headlights or sun glare) and washes out subtle character edges. Contrast Limited Adaptive Histogram Equalization (CLAHE) divides the image into 8×8 contextual grid tiles and equalizes each independently. It clips histogram bins that exceed a threshold (clipLimit=2.0) and redistributes the excess uniformly across the histogram before applying bilinear interpolation across tile borders.',
    },
    {
      q: '3. What is Laplacian Variance and why is it used in the preprocessing stage?',
      a: 'The Laplacian operator (∇²f = ∂²f/∂x² + ∂²f/∂y²) is a 2nd-order differential operator that measures rapid intensity changes (edges). In a sharp, noise-free image, the variance of the Laplacian response is high. In a blurry image, edges are smeared and the variance is low. In PlateVision, we calculate σ² = var(Laplacian(I)). If σ² < 50, the image is severely blurred or noisy, triggering strong bilateral filtering. If σ² > 500, denoising is skipped to avoid smearing character strokes.',
    },
    {
      q: '4. How does the Bilateral Filter preserve character edges while smoothing noise?',
      a: 'Unlike a standard Gaussian blur that only considers spatial distance between pixels, the Bilateral Filter multiplies two Gaussian kernels: a spatial kernel G_s(||p - q||) and a radiometric (intensity similarity) kernel G_r(||I_p - I_q||). If pixel q has a very different intensity from pixel p (such as at a black-on-white plate character edge), G_r approaches zero, preventing the filter from blurring across the edge boundary.',
    },
    {
      q: '5. Why is 4-point Perspective Transform necessary?',
      a: 'Cameras at traffic intersections or parking gates are rarely perfectly perpendicular to the license plate. The resulting trapezoidal perspective skew distorts character widths and spacing, degrading OCR accuracy. By detecting the 4 corner coordinates of the plate quadrilateral, we compute a 3×3 Homography Matrix H using cv2.getPerspectiveTransform and apply cv2.warpPerspective to project the plate into a frontal-parallel rectangle.',
    },
    {
      q: '6. Why did you choose YOLOv8 over classical Haar cascades or contours as the primary detector?',
      a: 'Classical contour detection relies on hand-crafted heuristics (aspect ratio, edge density) and fails whenever cars have horizontal grills, stickers, or complex backgrounds. Haar cascades are computationally outdated and suffer from high false-positive rates under varying lighting. YOLOv8 uses an anchor-free decoupled head with a CSPDarknet backbone, achieving high mean Average Precision (mAP) even under partial occlusion and extreme aspect ratios.',
    },
    {
      q: '7. How does the system handle OCR character confusion (e.g., O vs 0, I vs 1)?',
      a: 'OCR engines frequently confuse glyphs like 0/O, 1/I, 8/B, 5/S, and 2/Z. Rather than blind substitution, PlateVision implements a Position-Aware Confusion Matrix based on the Indian vehicle registration standard (SS DD XX NNNN). Characters in positions 0-1 (State code) are deterministically coerced to letters (e.g. 0 becomes O). Characters in positions 2-3 (District RTO) are coerced to digits (e.g. O becomes 0). The tail series and numbers are resolved according to alphanumeric transition points.',
    },
    {
      q: '8. How does the Indian Registration Number Validation engine work?',
      a: 'Instead of a fragile single regular expression, the validator checks against the official Ministry of Road Transport and Highways (MoRTH) standards. It validates the 2-letter state code against all 36 valid Indian States and Union Territories (e.g., DL for Delhi, MH for Maharashtra, KA for Karnataka), parses the 2-digit district code, validates the series length, and handles both standard and the new all-India Bharat (BH) series format.',
    },
    {
      q: '9. Why use Argon2id instead of SHA-256 or bcrypt for password hashing?',
      a: 'SHA-256 is an encryption hash designed for fast throughput, making it vulnerable to brute-force attacks at billions of hashes/sec on GPUs. bcrypt is memory-hard but susceptible to FPGA acceleration. Argon2id won the Password Hashing Competition (PHC) and combines Argon2d (resistant to GPU attacks) and Argon2i (resistant to side-channel cache-timing attacks). It is the OWASP gold standard.',
    },
    {
      q: '10. What is the database design and why are raw and normalized texts kept separate?',
      a: 'The database uses SQLAlchemy with a PostgreSQL/SQLite architecture. In the Recognitions table, plate_text_raw and plate_text_normalized are preserved separately. This is a critical engineering principle: never destroy raw sensor/OCR output. Storing the raw read alongside the post-processed result allows data scientists to measure OCR confusion rates and continuously tune the post-processing engine.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[rgba(15,23,42,0.7)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          Academically Defensible Viva Defense Manual
        </div>
        <h2 className="text-2xl font-extrabold text-white">
          PlateVision Architecture & Viva Defense Guide
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
          Everything required for a top-grade BCA/MCA viva presentation: complete mathematical formulations, algorithm trade-off justifications, and 10 expert examiner Q&As.
        </p>
      </div>

      {/* 3 Core Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">19-Stage CV Pipeline</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Zero black-box architecture. Every stage from noise variance to bilateral smoothing, 4-point homography, and morphological filtering is saved and inspectable.
          </p>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Deep Learning + Classical CV</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Hybrid architecture: YOLOv8 plate detector with automatic contour-based fallback, EasyOCR with topological character segmentation fallback.
          </p>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Enterprise Security & RBAC</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Argon2id password hashing, JWT access & refresh token rotation, Role-Based Access Control (Admin/Operator), and database audit logging.
          </p>
        </div>
      </div>

      {/* Top 10 Viva Questions Accordion */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Anticipated Examiner Viva Questions & Answers
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Click to expand answers
          </span>
        </div>

        <div className="space-y-3">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-[var(--border-subtle)] bg-[rgba(10,16,30,0.5)] overflow-hidden transition-all"
              >
                <button
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-white hover:text-cyan-300 transition-colors"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <span className="pr-4">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-3 bg-[rgba(6,9,17,0.4)]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
