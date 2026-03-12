import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  // Product
  "In Stock": { label: "In Stock", classes: "bg-success/10 text-success" },
  "Low Stock": { label: "Low Stock", classes: "bg-warning/10 text-warning" },
  "Out of Stock": { label: "Out of Stock", classes: "bg-danger/10 text-danger" },
  // Client
  "Active": { label: "Active", classes: "bg-success/10 text-success" },
  "Inactive": { label: "Inactive", classes: "bg-muted text-muted-foreground" },
  // Invoice
  "Paid": { label: "Paid", classes: "bg-success/10 text-success" },
  "Pending": { label: "Pending", classes: "bg-warning/10 text-warning" },
  "Overdue": { label: "Overdue", classes: "bg-danger/10 text-danger" },
  "Draft": { label: "Draft", classes: "bg-muted text-muted-foreground" },
  // Backend Mappings
  "in_stock": { label: "In Stock", classes: "bg-success/10 text-success" },
  "low_stock": { label: "Low Stock", classes: "bg-warning/10 text-warning" },
  "out_of_stock": { label: "Out of Stock", classes: "bg-danger/10 text-danger" },
  "active": { label: "Active", classes: "bg-success/10 text-success" },
  "inactive": { label: "Inactive", classes: "bg-muted text-muted-foreground" },
  "paid": { label: "Paid", classes: "bg-success/10 text-success" },
  "pending": { label: "Pending", classes: "bg-warning/10 text-warning" },
  "overdue": { label: "Overdue", classes: "bg-danger/10 text-danger" },
  "draft": { label: "Draft", classes: "bg-muted text-muted-foreground" },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] ?? { label: status, classes: "bg-muted text-muted-foreground" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
