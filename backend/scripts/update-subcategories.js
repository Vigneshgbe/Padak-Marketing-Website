// scripts/update-subcategories.js
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateSubcategories() {
  try {
    const subcategoriesSnap = await db.collection('service_subcategories').get();
    
    console.log(`Updating ${subcategoriesSnap.size} subcategories...`);
    
    for (const doc of subcategoriesSnap.docs) {
      await db.collection('service_subcategories').doc(doc.id).update({
        duration: '2-4 weeks',
        features: [],
        popular: false,
        // Keep existing is_active or default to true
        is_active: doc.data().is_active !== undefined ? doc.data().is_active : true
      });
      
      console.log(`✅ Updated: ${doc.data().name}`);
    }
    
    console.log('✅ All subcategories updated!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateSubcategories();