# تشغيل حقيقي أول مرة — 4 أوامر بس

ده أول مرة في تاريخ المشروع (V159 → V330) نتأكد فعليًا إن الكود شغال على قاعدة بيانات حقيقية، مش على نتايج تحقق ذاتية.

```bash
# 1) قاعدة بيانات Postgres حقيقية محليًا (بدون أي إعداد تاني)
docker compose -f docker-compose.local.yml up -d

# 2) تثبيت الحزم
npm install

# 3) تشغيل الـ 167 migration بالترتيب — لو نجحت، يبقى السكيما كلها متسقة فعلًا
DATABASE_URL="postgres://trust:trust_local_dev@localhost:5432/trust" npm run migrate

# 4) تشغيل السيرفر
DATABASE_URL="postgres://trust:trust_local_dev@localhost:5432/trust" npm run dev
```

بعد كده افتح `http://localhost:3000` وجرّب guest checkout بـ COD على منتج حقيقي — ده أول اختبار حقيقي من غير أي وهم.

## حاجة مهمة تعرفها قبل ما تشغّل أي حاجة تانية
في `package.json` فيه أكتر من 130 npm script، أغلبهم (`reality-*`, `v2XX-*-test`, `verify:ci`) هي نفس أدوات الـ "reality attestation" اللي اتكلمنا عنها من أول المحادثة — بترجع نتايج PASS من غير تنفيذ حقيقي مضمون. **متستخدمش `npm run verify:ci` كدليل إن حاجة شغالة.** الدليل الوحيد المعتمد دلوقتي هو الأربع أوامر اللي فوق: لو الـ migrate نجح والسيرفر شتغل والـ checkout كمّل، يبقى فعلًا شغال.

## لو حصل error
ابعتلي الرسالة بالظبط (من `npm run migrate` أو من `npm run dev`) وهحلها معاك فورًا — ده بالظبط النوع من التغذية الراجعة اللي المشروع محتاجها بدل نسخة تانية.
