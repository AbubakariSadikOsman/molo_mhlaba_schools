import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface UiState {
  toast: (msg: string) => void;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
  modalContent: ReactNode;
  modalKey: number;
  toastMsg: string | null;
  toastShow: boolean;
}

const Ctx = createContext<UiState | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastShow, setToastShow] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [modalKey, setModalKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToastShow(false), 2200);
  }, []);

  const openModal = useCallback((content: ReactNode) => {
    setModalContent(content);
    setModalKey((k) => k + 1);
  }, []);
  const closeModal = useCallback(() => setModalContent(null), []);

  return (
    <Ctx.Provider value={{ toast, openModal, closeModal, modalContent, modalKey, toastMsg, toastShow }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUi() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}

// Renders the modal + toast overlay. Content opened via openModal() (e.g. LogForm,
// which reads useAppData()) needs to be mounted somewhere inside AppDataProvider —
// so this is rendered from Shell, not from UiProvider itself (UiProvider sits above
// AppDataProvider in the tree, since pre-login screens need toast/modal too).
export function UiOverlay() {
  const { modalContent, modalKey, closeModal, toastMsg, toastShow } = useUi();

  return (
    <>
      <div
        className={`modal-backdrop${modalContent ? ' open' : ''}`}
        onClick={(e) => e.target === e.currentTarget && closeModal()}
      >
        <div className="modal">
          <ErrorBoundary key={modalKey}>{modalContent}</ErrorBoundary>
          {modalContent && (
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>
          )}
        </div>
      </div>
      <div className={`toast${toastShow ? ' show' : ''}`}>{toastMsg}</div>
    </>
  );
}
