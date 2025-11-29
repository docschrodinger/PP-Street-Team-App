import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import SignatureCanvas from 'react-signature-canvas';
import { X, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ESignatureProps {
  documentTitle: string;
  documentContent: string; // HTML or text content
  legalName: string;
  onSign: (signatureData: string, timestamp: string, ipAddress: string) => void;
  onCancel: () => void;
}

export function ESignature({ 
  documentTitle, 
  documentContent, 
  legalName,
  onSign,
  onCancel 
}: ESignatureProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [agreed, setAgreed] = useState(false);
  const [signatureEmpty, setSignatureEmpty] = useState(true);

  function handleClear() {
    sigCanvas.current?.clear();
    setSignatureEmpty(true);
  }

  function handleEnd() {
    setSignatureEmpty(sigCanvas.current?.isEmpty() ?? true);
  }

  async function handleSign() {
    if (!agreed || signatureEmpty) return;

    const signatureData = sigCanvas.current?.toDataURL() || '';
    const timestamp = new Date().toISOString();
    
    // Get IP address (in production, you'd get this from server)
    const ipAddress = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => 'Unknown');

    onSign(signatureData, timestamp, ipAddress);
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[#F6F2EE]">{documentTitle}</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-[#FF4444] transition-colors border-2 border-[#F6F2EE]"
          >
            <X className="w-5 h-5 text-[#F6F2EE]" />
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Document Viewer */}
          <div className="p-6 bg-[#151515] border-3 border-[#F6F2EE] max-h-96 overflow-y-auto">
            <div 
              className="text-[#F6F2EE] prose prose-invert prose-sm"
              dangerouslySetInnerHTML={{ __html: documentContent }}
            />
          </div>

          {/* Agreement Checkbox */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-[#151515] border-3 border-[#8A4FFF]"
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 mt-1 accent-[#8A4FFF]"
              />
              <div>
                <p className="text-[#F6F2EE] font-bold mb-1">
                  I have read and agree to the terms
                </p>
                <p className="text-[#A0A0A0] text-sm">
                  By checking this box and signing below, you acknowledge that you have read, 
                  understand, and agree to be bound by the terms of this agreement.
                </p>
              </div>
            </label>
          </motion.div>

          {/* Signature Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div>
              <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3">
                Your Signature
              </h4>
              
              <div className="p-4 bg-[#F6F2EE] border-4 border-[#F6F2EE]">
                <SignatureCanvas
                  ref={sigCanvas}
                  onEnd={handleEnd}
                  canvasProps={{
                    className: 'signature-canvas w-full h-40 cursor-crosshair',
                    style: { touchAction: 'none' }
                  }}
                  backgroundColor="#F6F2EE"
                  penColor="#050505"
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <p className="text-[#A0A0A0] text-xs">
                  Sign with your finger or mouse
                </p>
                <button
                  onClick={handleClear}
                  className="text-[#8A4FFF] text-sm hover:text-[#FF7A59] transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Legal Info */}
            <div className="p-4 bg-[#151515] border-2 border-[#F6F2EE]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#A0A0A0] text-xs mb-1">Legal Name</p>
                  <p className="text-[#F6F2EE] font-bold">{legalName}</p>
                </div>
                <div>
                  <p className="text-[#A0A0A0] text-xs mb-1">Date</p>
                  <p className="text-[#F6F2EE] font-bold">
                    {new Date().toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-4 bg-[#0A0A0A] border-2 border-[#FFD700]">
              <p className="text-[#FFD700] text-xs">
                <strong>Legal Notice:</strong> By signing this document electronically, you agree that your electronic 
                signature is the legal equivalent of your manual signature on this agreement. You further 
                agree that no certification authority or other third party verification is necessary to 
                validate your electronic signature and that the lack of such certification or third party 
                verification will not in any way affect the enforceability of your signature.
              </p>
            </div>

            {/* Sign Button */}
            <Button
              onClick={handleSign}
              disabled={!agreed || signatureEmpty}
              className="w-full h-14 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] uppercase tracking-wider font-bold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              {!agreed ? (
                'Please agree to terms above'
              ) : signatureEmpty ? (
                'Please sign above'
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Sign Agreement
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
