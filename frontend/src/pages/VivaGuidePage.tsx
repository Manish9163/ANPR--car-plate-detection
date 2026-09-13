import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  Cpu,
  Shield,
} from 'lucide-react';

export function VivaGuidePage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="border-b border-border-subtle pb-6 space-y-2">
        <div className="flex items-center gap-2 text-accent font-mono text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          Academic Defensibility Manual
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          PlateVision Architecture & Viva Defense Manual
        </h1>
        <p className="text-sm text-text-muted max-w-3xl">
          Everything required for a top-grade BCA/MCA viva presentation: complete mathematical formulations,
          algorithmic trade-off justifications, and 10 examiner Q&As.
        </p>
      </div>

      {/* ── 3 Architecture Pillars ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-lg bg-bg-surface border border-border-default space-y-2">
          <div className="w-8 h-8 rounded-md bg-accent/15 flex items-center justify-center text-accent">
            <Layers className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-text-primary">19-Stage CV Pipeline</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Zero black-box architecture. Every stage from noise variance to bilateral smoothing, 4-point homography, and morphological filtering is inspectable.
          </p>
        </div>

        <div className="p-5 rounded-lg bg-bg-surface border border-border-default space-y-2">
          <div className="w-8 h-8 rounded-md bg-info/15 flex items-center justify-center text-info">
            <Cpu className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-text-primary">Deep Learning + Classical CV</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Hybrid design: YOLOv8 plate detector with automatic contour fallback; EasyOCR with topological character segmentation.
          </p>
        </div>

        <div className="p-5 rounded-lg bg-bg-surface border border-border-default space-y-2">
          <div className="w-8 h-8 rounded-md bg-warning/15 flex items-center justify-center text-warning">
            <Shield className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-text-primary">Security & RBAC</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Argon2id password hashing, JWT stateless authentication tokens, role-based access control, and complete audit logging.
          </p>
        </div>
      </div>

      {/* ── Mathematical Formulations ── */}
      <div className="p-6 rounded-lg bg-bg-surface border border-border-default space-y-4">
        <h2 className="text-base font-semibold text-text-primary">
          Key Mathematical Formulations (Examiner Cheat Sheet)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded bg-bg-elevated border border-border-subtle space-y-1">
            <span className="font-mono font-bold text-accent">Bilateral Filter Formula</span>
            <p className="text-text-muted font-mono text-[0.7rem]">
              I_filtered(x) = (1/W_p) * ∑ I(x_i) * f(||x - x_i||) * g(||I(x) - I(x_i)||)
            </p>
            <p className="text-[0.68rem] text-text-secondary pt-1">
              Combines geometric distance f() with intensity similarity g() to prevent blurring across edges.
            </p>
          </div>

          <div className="p-4 rounded bg-bg-elevated border border-border-subtle space-y-1">
            <span className="font-mono font-bold text-accent">Laplacian Blur Metric</span>
            <p className="text-text-muted font-mono text-[0.7rem]">
              Var(∇²I) = (1/N) * ∑ [∇²I(x,y) - μ]²
            </p>
            <p className="text-[0.68rem] text-text-secondary pt-1">
              Variance of second derivatives measures edge sharpness. &lt;50 triggers heavy bilateral smoothing.
            </p>
          </div>
        </div>
      </div>

      {/* ── 10 Comprehensive Viva Questions Accordion ── */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">
          Examiner Q&A Defense Bank (Click to Expand)
        </h2>

        {vivaQuestions.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-lg bg-bg-surface border border-border-default overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-bg-elevated/40 transition-colors cursor-pointer"
              >
                <span className="text-sm font-semibold text-text-primary">{item.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="p-4 pt-1 border-t border-border-subtle text-xs text-text-secondary leading-relaxed bg-bg-elevated/20">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
