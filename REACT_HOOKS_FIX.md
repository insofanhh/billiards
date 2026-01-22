# React Hooks Error Fix

## 🐛 Lỗi
```
Error: Rendered more hooks than during the previous render.
at PaymentQRCode component
```

## ❌ Nguyên nhân

**Vị trí hooks không đúng** - Vi phạm Rules of Hooks:

```typescript
// ❌ SAI: useEffect nằm sau early return
const Component = () => {
  const [state, setState] = useState();
  
  // Early return
  if (loading) {
    return <Loading />;
  }
  
  // ❌ Hook này chỉ chạy khi không loading
  useEffect(() => { ... }, [dep]);  
  
  return <Main />;
}
```

**Vấn đề:**
- Khi `loading = true`: Chỉ 1 hook được gọi (useState)
- Khi `loading = false`: 2 hooks được gọi (useState + useEffect)
- ❌ Số lượng hooks thay đổi → React báo lỗi

## ✅ Giải pháp

**Di chuyển TẤT CẢ hooks lên trước early return:**

```typescript
// ✅ ĐÚNG: Tất cả hooks ở top level
const Component = () => {
  // 1. Tất cả hooks trước
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  
  useEffect(() => { ... }, [dep1]);
  useEffect(() => { ... }, [dep2]);
  
  // 2. Computed values
  const value = computeValue(state1);
  
  // 3. Early return SAU hooks
  if (loading) {
    return <Loading />;
  }
  
  // 4. Main render
  return <Main />;
}
```

## 📋 Rules of Hooks

### 1. Only call hooks at the top level ✅
```typescript
// ✅ Đúng
function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {}, []);
  
  if (condition) return null;
  return <div />;
}

// ❌ Sai
function Component() {
  if (condition) {
    const [state, setState] = useState(0);  // ❌
  }
  return <div />;
}
```

### 2. Only call hooks from React functions ✅
```typescript
// ✅ Đúng: Trong React component
function Component() {
  const [state] = useState(0);
}

// ✅ Đúng: Trong custom hook
function useCustomHook() {
  const [state] = useState(0);
}

// ❌ Sai: Trong regular function
function regularFunction() {
  const [state] = useState(0);  // ❌
}
```

### 3. Call hooks in the same order ✅
```typescript
// ✅ Đúng: Thứ tự giống nhau mọi lúc
function Component() {
  const [state1] = useState(0);    // Hook 1
  const [state2] = useState('');   // Hook 2
  useEffect(() => {}, []);         // Hook 3
  
  return <div />;
}

// ❌ Sai: Thứ tự thay đổi
function Component() {
  if (condition) {
    const [state1] = useState(0);  // ❌ Conditional hook
  }
  const [state2] = useState('');
  useEffect(() => {}, []);
  
  return <div />;
}
```

## 🔧 Các trường hợp thường gặp

### Case 1: Hook sau early return
```typescript
// ❌ Sai
if (loading) return <Loading />;
useEffect(() => {}, []);  // ❌

// ✅ Đúng
useEffect(() => {}, []);  // ✅
if (loading) return <Loading />;
```

### Case 2: Hook trong condition
```typescript
// ❌ Sai
if (condition) {
  useEffect(() => {}, []);  // ❌
}

// ✅ Đúng
useEffect(() => {
  if (condition) {
    // Logic here
  }
}, [condition]);
```

### Case 3: Hook trong loop
```typescript
// ❌ Sai
items.forEach(item => {
  const [state] = useState(item);  // ❌
});

// ✅ Đúng
const [states] = useState(items);
```

### Case 4: Hook trong callback
```typescript
// ❌ Sai
onClick={() => {
  const [state] = useState(0);  // ❌
}}

// ✅ Đúng
const [state, setState] = useState(0);
onClick={() => {
  setState(prev => prev + 1);
}}
```

## 🎯 Fix cho PaymentQRCode component

### Before (❌ Sai)
```typescript
export const PaymentQRCode = ({ amount, referenceCode }) => {
  const [timeLeft, setTimeLeft] = useState(600);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const { storeSlug } = useParams();

  useEffect(() => {
    // Fetch payment info
  }, [storeSlug]);

  // Early return
  if (loading) {
    return <Loading />;
  }

  // ❌ Hook này sau early return
  useEffect(() => {
    // Timer
  }, [timeLeft]);

  return <QRCode />;
};
```

### After (✅ Đúng)
```typescript
export const PaymentQRCode = ({ amount, referenceCode }) => {
  // ✅ Tất cả hooks trước
  const [timeLeft, setTimeLeft] = useState(600);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const { storeSlug } = useParams();

  useEffect(() => {
    // Fetch payment info
  }, [storeSlug]);

  useEffect(() => {
    // Timer - Đã di chuyển lên trước early return
  }, [timeLeft]);

  // Computed values
  const bankAccount = paymentInfo?.bank_account || "default";
  const qrUrl = generateQRUrl(bankAccount);

  // Early return sau hooks
  if (loading) {
    return <Loading />;
  }

  return <QRCode />;
};
```

## 🚀 Cách fix khi gặp lỗi này

1. **Tìm tất cả hooks** trong component
   ```bash
   # Search for hooks
   - useState
   - useEffect
   - useCallback
   - useMemo
   - useRef
   - useContext
   - useParams
   - useNavigate
   - custom hooks (useXxx)
   ```

2. **Di chuyển hooks lên đầu component**
   - Trước tất cả early returns
   - Trước tất cả conditions
   - Trước tất cả loops

3. **Clear cache và restart**
   ```bash
   # Xóa Vite cache
   rm -rf .vite
   rm -rf node_modules/.vite
   
   # Hard refresh browser
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

4. **Verify**
   - Tất cả hooks ở top level ✅
   - Hooks được gọi theo thứ tự giống nhau ✅
   - Không có hooks trong conditions/loops ✅

## 📚 Tài liệu tham khảo

- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)

## ✅ Checklist

Sau khi fix:
- [x] Tất cả hooks ở top level
- [x] Hooks trước early returns
- [x] Hooks trước conditions
- [x] Clear Vite cache
- [x] Hard refresh browser
- [x] Test component hoạt động
- [x] No console errors

**Status: FIXED** ✅
