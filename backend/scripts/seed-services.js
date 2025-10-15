// scripts/seed-services.js
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const serviceCategories = [
  {
    name: 'Digital Marketing',
    description: 'Comprehensive digital marketing solutions to grow your online presence',
    icon: 'trending',
    is_active: true,
    subcategories: [
      {
        name: 'SEO Optimization',
        description: 'Improve your search engine rankings and organic traffic',
        base_price: 15000
      },
      {
        name: 'Social Media Marketing',
        description: 'Engage your audience across all social platforms',
        base_price: 20000
      },
      {
        name: 'Content Marketing',
        description: 'Create compelling content that drives conversions',
        base_price: 12000
      },
      {
        name: 'Email Marketing',
        description: 'Build and nurture customer relationships via email',
        base_price: 8000
      },
      {
        name: 'PPC Advertising',
        description: 'Targeted paid advertising campaigns for maximum ROI',
        base_price: 25000
      }
    ]
  },
  {
    name: 'Web Development',
    description: 'Professional web development services for modern businesses',
    icon: 'code',
    is_active: true,
    subcategories: [
      {
        name: 'Custom Website Development',
        description: 'Fully customized websites tailored to your needs',
        base_price: 50000
      },
      {
        name: 'E-commerce Solutions',
        description: 'Build powerful online stores with seamless checkout',
        base_price: 75000
      },
      {
        name: 'Website Maintenance',
        description: 'Keep your website secure, updated, and running smoothly',
        base_price: 5000
      },
      {
        name: 'Landing Page Design',
        description: 'High-converting landing pages for your campaigns',
        base_price: 15000
      },
      {
        name: 'Web Application Development',
        description: 'Complex web applications with advanced functionality',
        base_price: 100000
      }
    ]
  },
  {
    name: 'Branding & Design',
    description: 'Creative design services that make your brand stand out',
    icon: 'pen',
    is_active: true,
    subcategories: [
      {
        name: 'Logo Design',
        description: 'Professional logo design that represents your brand',
        base_price: 8000
      },
      {
        name: 'Brand Identity',
        description: 'Complete brand identity packages with guidelines',
        base_price: 30000
      },
      {
        name: 'UI/UX Design',
        description: 'User-centered design for websites and applications',
        base_price: 25000
      },
      {
        name: 'Graphic Design',
        description: 'Marketing materials, brochures, and print design',
        base_price: 10000
      },
      {
        name: 'Package Design',
        description: 'Product packaging that stands out on shelves',
        base_price: 20000
      }
    ]
  },
  {
    name: 'Business Consulting',
    description: 'Strategic business consulting to accelerate your growth',
    icon: 'briefcase',
    is_active: true,
    subcategories: [
      {
        name: 'Business Strategy',
        description: 'Develop winning strategies for sustainable growth',
        base_price: 40000
      },
      {
        name: 'Market Research',
        description: 'In-depth market analysis and competitor research',
        base_price: 30000
      },
      {
        name: 'Financial Planning',
        description: 'Financial planning and budget optimization',
        base_price: 35000
      },
      {
        name: 'Process Optimization',
        description: 'Streamline operations and improve efficiency',
        base_price: 25000
      }
    ]
  },
  {
    name: 'Training & Education',
    description: 'Professional training programs to upskill your team',
    icon: 'book',
    is_active: true,
    subcategories: [
      {
        name: 'Digital Marketing Training',
        description: 'Comprehensive digital marketing courses for teams',
        base_price: 15000
      },
      {
        name: 'Technical Skills Training',
        description: 'Web development and programming workshops',
        base_price: 20000
      },
      {
        name: 'Leadership Development',
        description: 'Build strong leaders within your organization',
        base_price: 25000
      },
      {
        name: 'Sales Training',
        description: 'Improve sales skills and closing techniques',
        base_price: 18000
      }
    ]
  }
];

async function seedServices() {
  try {
    console.log('🌱 Starting service categories seeding...');

    for (const category of serviceCategories) {
      // Create category
      const categoryRef = db.collection('service_categories').doc();
      await categoryRef.set({
        name: category.name,
        description: category.description,
        icon: category.icon,
        is_active: category.is_active,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Created category: ${category.name}`);

      // Create subcategories
      for (const subcategory of category.subcategories) {
        const subcategoryRef = db.collection('service_subcategories').doc();
        await subcategoryRef.set({
          category_id: categoryRef.id,
          name: subcategory.name,
          description: subcategory.description,
          base_price: subcategory.base_price,
          is_active: true,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`  ↳ Created subcategory: ${subcategory.name}`);
      }
    }

    console.log('\n🎉 Service categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding services:', error);
    process.exit(1);
  }
}

seedServices();