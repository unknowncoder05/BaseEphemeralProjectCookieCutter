import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Badge, 
  Skeleton, 
  SmartImage, 
  EmptyState, 
  Breadcrumbs,
  Loading,
  Input
} from '../../components/shared';

const ComponentLibrary: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 p-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-12">
        <header>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Component Library</h1>
          <p className="text-secondary-500 dark:text-secondary-300">Professional components for {process.env.REACT_APP_PROJECT_NAME || 'My App'}</p>
        </header>

        {/* Breadcrumbs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 border-b border-secondary-200 dark:border-secondary-700 pb-2">Breadcrumbs</h2>
          <Breadcrumbs />
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 border-b border-secondary-200 dark:border-secondary-700 pb-2">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 border-b border-secondary-200 dark:border-secondary-700 pb-2">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </section>

        {/* Skeletons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 border-b border-secondary-200 dark:border-secondary-700 pb-2">Skeleton Loading</h2>
          <div className="max-w-md space-y-4 bg-white dark:bg-secondary-800 p-6 rounded-xl border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center space-x-4">
              <Skeleton variant="circle" width={48} height={48} />
              <div className="space-y-2 flex-1">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </div>
            </div>
            <Skeleton variant="rect" height={160} width="100%" />
          </div>
        </section>

        {/* Smart Image */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 border-b border-secondary-200 dark:border-secondary-700 pb-2">Smart Image (Resilient)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-sm text-secondary-500">Valid Image with Shimmer</p>
              <SmartImage 
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80" 
                alt="Demo"
                containerClassName="aspect-video rounded-xl shadow-lg"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-secondary-500">Broken Image (Auto-Fallback)</p>
              <SmartImage 
                src="https://invalid-image-url.com/broken.jpg" 
                alt="Broken Demo"
                containerClassName="aspect-video rounded-xl shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 border-b border-secondary-200 dark:border-secondary-700 pb-2">Cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card title="Default Card" description="A basic card with title and description.">
              <p className="text-sm text-secondary-600 dark:text-secondary-300">Card content goes here.</p>
            </Card>
            <Card title="Hoverable Card" description="Move your mouse over this card." hoverable>
              <p className="text-sm text-secondary-600 dark:text-secondary-300">Perfect for clickable items.</p>
            </Card>
            <Card className="border-primary-500 dark:border-primary-400">
              <div className="text-center py-4">
                <Badge variant="primary" className="mb-2">Custom Card</Badge>
                <p className="text-secondary-900 dark:text-white font-medium">Fully customizable via className.</p>
              </div>
            </Card>
          </div>
        </section>

        {/* Empty States */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 border-b border-secondary-200 dark:border-secondary-700 pb-2">Empty States</h2>
          <EmptyState 
            title="No records found" 
            description="Your search didn't match any results. Try broadening your criteria or adding a new item."
            action={<Button variant="primary">Add New Item</Button>}
          />
        </section>

        {/* Loading */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 border-b border-secondary-200 dark:border-secondary-700 pb-2">Loading Spinners</h2>
          <div className="flex items-center space-x-12">
            <div className="text-center">
              <Loading size="sm" />
              <p className="text-xs text-secondary-500 mt-2">Small</p>
            </div>
            <div className="text-center">
              <Loading size="md" />
              <p className="text-xs text-secondary-500 mt-2">Medium</p>
            </div>
            <div className="text-center">
              <Loading size="lg" message="Loading data..." />
              <p className="text-xs text-secondary-500 mt-2">Large w/ Message</p>
            </div>
          </div>
        </section>

        {/* Forms */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 border-b border-secondary-200 dark:border-secondary-700 pb-2">Inputs</h2>
          <div className="max-w-md space-y-4">
            <Input label="Text Input" placeholder="Enter something..." />
            <Input label="Input with Error" error="This field is required" defaultValue="Invalid value" />
            <Input label="Disabled Input" disabled value="Cannot edit this" />
          </div>
        </section>

        <footer className="pt-12 pb-8 text-center border-t border-secondary-200 dark:border-secondary-700">
          <p className="text-sm text-secondary-600 dark:text-secondary-300 italic">Press Ctrl+K to open the Command Palette from anywhere.</p>
        </footer>
      </div>
    </div>
  );
};

export default ComponentLibrary;
