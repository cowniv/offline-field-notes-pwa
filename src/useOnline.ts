import { useEffect, useState } from "react";

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
