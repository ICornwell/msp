import React from 'react';

export default function ReGroup({ hidden, children }: { hidden: boolean, children: React.ReactNode }) {
  return hidden ? null :
    (<div className="re-group">
      {children}
    </div>)
}