import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export default function EmailTemplate({ userName, data }) {
  return React.createElement(
    Html,
    null,
    React.createElement(
      Head,
      null
    ),
    React.createElement(Preview, null, "Your Monthly Financial Report"),
    React.createElement(
      Body,
      { style: styles.body },
      React.createElement(
        Container,
        { style: styles.container },
        React.createElement(Heading, { style: styles.title }, "Monthly Financial Report"),
        React.createElement(Text, { style: styles.text }, `Hello ${userName},`),
        React.createElement(Text, { style: styles.text }, `Here's your financial summary for ${data?.month}:`),

        React.createElement(
          Section,
          { style: styles.statsContainer },
          React.createElement(
            "div",
            { style: styles.stat },
            React.createElement(Text, { style: styles.text }, "Total Income"),
            React.createElement(Text, { style: styles.heading }, `₹${parseFloat(data?.stats.totalIncome).toFixed(2)}`)
          ),
          React.createElement(
            "div",
            { style: styles.stat },
            React.createElement(Text, { style: styles.text }, "Total Expenses"),
            React.createElement(Text, { style: styles.heading }, `₹${parseFloat(data?.stats.totalExpense).toFixed(2)}`)
          ),
          React.createElement(
            "div",
            { style: styles.stat },
            React.createElement(Text, { style: styles.text }, "Net"),
            React.createElement(
              Text,
              { style: styles.heading },
              `₹${parseFloat(data?.stats.totalIncome - data?.stats.totalExpense).toFixed(2)}`
            )
          )
        ),

        data?.stats?.byCategory &&
          React.createElement(
            Section,
            { style: styles.section },
            React.createElement(Heading, { style: styles.heading }, "Expenses by Category"),
            ...Object.entries(data.stats.byCategory).map(([category, amount]) =>
              React.createElement(
                "div",
                { key: category, style: styles.row },
                React.createElement(Text, { style: styles.text }, category),
                React.createElement(Text, { style: styles.text }, `₹${parseFloat(amount).toFixed(2)}`)
              )
            )
          ),

        data?.insights &&
          React.createElement(
            Section,
            { style: styles.section },
            React.createElement(Heading, { style: styles.heading }, "PennyPilot Insights"),
            ...data.insights.map((insight, i) =>
              React.createElement(Text, { key: i, style: styles.text }, `• ${insight}`)
            )
          ),

        React.createElement(
          Text,
          { style: styles.footer },
          "Thank you for using PennyPilot. Keep tracking your finances for better financial health!"
        )
      )
    )
  );
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily: "-apple-system, sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  title: {
    color: "#1f2937",
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
    margin: "0 0 20px",
  },
  heading: {
    color: "#1f2937",
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 16px",
  },
  text: {
    color: "#4b5563",
    fontSize: "16px",
    margin: "0 0 16px",
  },
  section: {
    marginTop: "32px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
    border: "1px solid #e5e7eb",
  },
  statsContainer: {
    margin: "32px 0",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
  },
  stat: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  footer: {
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "32px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
};
