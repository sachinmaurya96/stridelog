'use client';

import { useEffect, useState } from 'react';

/** An object URL for a Blob, revoked automatically when the blob changes or the component unmounts. */
export function useObjectUrl(blob: Blob | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is created by this effect and revoked in its cleanup
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
      setUrl(null);
    };
  }, [blob]);
  return blob ? url : null;
}
