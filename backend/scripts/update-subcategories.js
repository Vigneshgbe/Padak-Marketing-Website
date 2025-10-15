// scripts/update-subcategories-with-ratings.js
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateSubcategories() {
  try {
    const subcategoriesSnap = await db.collection('service_subcategories').get();
    
    console.log(`📝 Updating ${subcategoriesSnap.size} subcategories...`);
    
    for (const doc of subcategoriesSnap.docs) {
      const data = doc.data();
      
      await db.collection('service_subcategories').doc(doc.id).update({
        duration: data.duration || 'Variable',
        features: data.features || [],
        rating: data.rating || 0,
        reviews: data.reviews || 0,
        popular: data.popular || false,
        is_active: data.is_active !== false
      });
      
      console.log(`✅ Updated: ${data.name}`);
    }
    
    console.log('✅ All subcategories updated!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateSubcategories();