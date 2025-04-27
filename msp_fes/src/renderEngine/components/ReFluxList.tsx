import { ComponentChildren } from 'preact';

export default function ReGroup({ hidden, children }: { hidden: boolean, children: ComponentChildren }) {
  return hidden ? null :
    (<div class="re-group">
      {children}
    </div>)
}