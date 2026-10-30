import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <Card variant="flat" className="p-8 border border-[#243049] flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3DDC97]/15 text-[#3DDC97] mb-4">
          <Compass className="h-8 w-8" />
        </div>
        <span className="text-xs uppercase font-mono text-[#9BA9C3] tracking-widest mb-1">
          Uncharted Territory
        </span>
        <h1 className="font-serif text-3xl font-medium text-white mb-2">
          Page Beyond the Map
        </h1>
        <p className="text-xs text-[#9BA9C3] max-w-xs mb-6 font-light">
          The path you took does not exist in the Travi sanctuary ledger.
        </p>
        <a href="/">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Return to Exploration
          </Button>
        </a>
      </Card>
    </div>
  );
};
