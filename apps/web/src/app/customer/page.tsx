import { redirect } from 'next/navigation';
import { roleHome } from '@/lib/otpAuth';

// The customer portal has no overview page: /customer lands on the customer home.
export default function CustomerIndexPage() {
  redirect(roleHome('CUSTOMER'));
}
