import { Mail, Plus, Send, TrendingUp, Users, Eye } from "lucide-react"

const campaigns = [
  { id: 1, name: "January Newsletter", status: "sent", recipients: 2450, opened: 1203, date: "Jan 15 2026" },
  { id: 2, name: "Winter Discounts", status: "sent", recipients: 3200, opened: 1856, date: "Jan 10 2026" },
  { id: 3, name: "New Products", status: "draft", recipients: 0, opened: 0, date: "Draft" },
  { id: 4, name: "Cart Abandonment", status: "active", recipients: 156, opened: 89, date: "Automation" },
]

const stats = [
  { label: "Total Subscribers", value: "3,542", icon: Users, color: "bg-blue-100 text-blue-600" },
  { label: "Open Rate", value: "48.5%", icon: Eye, color: "bg-green-100 text-green-600" },
  { label: "Emails Sent This Month", value: "5,806", icon: Send, color: "bg-purple-100 text-purple-600" },
]

export default function EmailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-500">Email campaigns and automations</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Campaigns</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-6 py-4 font-medium">Campaign</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Recipients</th>
              <th className="px-6 py-4 font-medium">Opened</th>
              <th className="px-6 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">{campaign.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    campaign.status === "sent" ? "bg-green-100 text-green-700" :
                    campaign.status === "active" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {campaign.status === "sent" ? "Sent" : campaign.status === "active" ? "Active" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-900">{campaign.recipients.toLocaleString()}</td>
                <td className="px-6 py-4">
                  {campaign.opened > 0 ? (
                    <span className="text-green-600">{campaign.opened.toLocaleString()} ({Math.round(campaign.opened/campaign.recipients*100)}%)</span>
                  ) : "-"}
                </td>
                <td className="px-6 py-4 text-gray-500">{campaign.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
