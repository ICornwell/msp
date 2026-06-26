import { Columns, LabelFrame, PresetBooleanComponent, StatusLabel } from 'msp_ui_common/uiLib';
import { builder4 as wizPage3 } from '../awsSetupWizardContent';

export function withSecurityBaselinePage(builder: typeof wizPage3) {
  return builder
    .withPage('security-baseline', 'Security Baseline')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Next', role: 'next' },
      ])
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Always On: baseline controls enabled for every environment.')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => 'These are enabled for all environments and cannot be turned off:\n\n• VPC Flow Logs — network traffic audit trail\n• AWS CloudTrail — full API audit log (who did what and when)\n• Security Groups — network access control at the resource level\n• ACM — managed TLS certificates for your load balancers')
            .endElement
          .end()
        .endElement
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Protection and Detection')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => 'These are on by default and recommended for all environments. Turn off only if you have a specific reason (e.g. cost reduction in short-lived dev environments).')
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Web Application Firewall (WAF) — protects your load balancer from web attacks')
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.security?.wafEnabled !== false)
                .endElement
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Threat Detection (GuardDuty) — monitors for unusual API calls and malicious IPs')
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.security?.guardDuty !== false)
                .endElement
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Security Findings Dashboard (Security Hub) — aggregates security alerts')
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.security?.securityHub !== false)
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
